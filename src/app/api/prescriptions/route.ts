export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../middleware/auth';
import { Prescription, ExtractedMedicine, MatchedProduct, Medicine, User } from '../../../models';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { calculateSimilarity } from '../../../utils/fuzzyMatch';

// Gemini API will be initialized dynamically per request

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth; // Return unauthorized response
    const userId = userAuth.id;

    const dbUser = await User.findByPk(userId);
    const accountName = dbUser?.name || '';
    const accountAge = dbUser?.age ? `${dbUser.age} yrs` : '';

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // 1. Validate File Size & Format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Only JPG, PNG, WEBP, HEIC, and PDF are allowed.' }, { status: 400 });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'File size must be less than 5MB.' }, { status: 400 });
    }

    // 2. Store File Securely in public/uploads/prescriptions
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'prescriptions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `rx_${userId}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    
    const fileUrl = `/uploads/prescriptions/${fileName}`;

    // 3. Create initial Prescription record
    const prescription = await Prescription.create({
      userId,
      fileUrl,
      status: 'Processing'
    });

    // 4. OCR + AI Prescription Reading (Gemini)
    if (!process.env.GEMINI_API_KEY || process.env.USE_MOCK_AI === 'true') {
      console.log('GEMINI_API_KEY is missing or USE_MOCK_AI is true. Using mock extraction data for testing.');
      
      // Mock data representing a successful AI extraction and DB match
      const mockMedicines = [
        {
          extracted: { medicineName: "Novamox 500", strength: "500mg", dosage: "1-0-1", duration: "5 days", quantity: 10, confidence: 0.95 },
          match: { matchType: "Exact", confidenceScore: 1.0 },
          product: {
            id: 1,
            name: "Gefitinib 250mg (Geftinat)",
            genericName: "Amoxicillin Trihydrate",
            price: 1420.00,
            discountPrice: 245.00,
            images: ["/medicines/geftinat.jpg"],
            requiresPrescription: true
          }
        },
        {
          extracted: { medicineName: "Montair LC", strength: "", dosage: "0-0-1", duration: "10 days", quantity: 10, confidence: 0.90 },
          match: { matchType: "Exact", confidenceScore: 1.0 },
          product: {
            id: 2,
            name: "Mycophenolate Mofetil 500mg",
            genericName: "Montelukast 10mg + Levocetirizine 5mg",
            price: 180.00,
            discountPrice: 58.00,
            images: ["/medicines/mycophenolate.jpg"],
            requiresPrescription: true
          }
        }
      ];

      return NextResponse.json({ 
        success: true, 
        message: 'Mock extraction used (AI disabled).',
        data: { 
          prescription,
          metadata: {
            patientName: accountName || "Ramesh Kumar",
            patientAge: accountAge || "42 yrs",
            doctorName: "Dr. Sameer Verma, MD",
            doctorSpecialty: "Pulmonologist"
          },
          medicines: mockMedicines
        }
      }, { status: 200 });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        You are a pharmacy prescription analyzer.

        Extract:
        - medicine_name
        - strength
        - dosage_form
        - frequency
        - duration

        Rules:
        1. Ignore handwriting style if text is clearly readable.
        2. Match generic and brand names.
        3. Return the closest medicine in the catalog.
        4. Use fuzzy matching.
        5. If medicine exists with >90% confidence, status = matched.
        You are a highly accurate pharmacy prescription analyzer. 
        Extract the following information from the provided prescription image.
        If the doctor's name or patient's name is not explicitly visible, you can infer them if they appear in typical locations, otherwise set them to null.
        
        Return the result STRICTLY as a JSON object with this exact structure (no markdown, no formatting):
        {
          "patientName": "e.g., Ramesh Kumar",
          "patientAge": "e.g., 42 yrs",
          "doctorName": "e.g., Dr. Sameer Verma, MD",
          "doctorSpecialty": "e.g., Pulmonologist",
          "medicines": [
            {
              "name": "Medicine Name",
              "strength": "e.g., 500mg, 10ml",
              "dosage": "e.g., 1-0-1, twice a day",
              "duration": "e.g., 5 days",
              "quantity": 10,
              "confidence": 0.95
            }
          ]
        }
        
        If a field is unreadable or not present, omit it or set it to null. Estimate the 'confidence' score between 0.0 to 1.0 on how sure you are about the extracted medicine name. If the handwriting is legible, return 0.9 or 1.0.
      `;

      const mimeType = file.type === 'application/pdf' ? 'application/pdf' : (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');
      
      const imageParts = [
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text().trim();
      
      // Clean potential markdown blocks
      let jsonString = responseText;
      if (jsonString.startsWith('\`\`\`')) {
        jsonString = jsonString.replace(/^\`\`\`(json)?/, '').replace(/\`\`\`$/, '').trim();
      }

      let extractedData: any = {};
      try {
        extractedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse Gemini output:', responseText);
        throw new Error('AI returned invalid JSON format');
      }

      const medicinesList = Array.isArray(extractedData) ? extractedData : (extractedData.medicines || []);
      let parsedPatient = extractedData.patientName;
      if (!parsedPatient || parsedPatient.toLowerCase().includes('unknown')) {
        parsedPatient = accountName || 'Unknown Patient';
      }

      const metadata = {
        patientName: parsedPatient,
        patientAge: extractedData.patientAge || accountAge || '',
        doctorName: extractedData.doctorName || 'Unknown Doctor',
        doctorSpecialty: extractedData.doctorSpecialty || ''
      };

      let overallConfidence = 1.0;
      let hasLowConfidence = false;

      // 5. Match Medicines with Product Database
      const matchedResults = [];

      for (const item of medicinesList) {
        if (!item.name) continue;

        // Save extracted item
        const extractedMed = await ExtractedMedicine.create({
          prescriptionId: prescription.id,
          medicineName: item.name,
          strength: item.strength || null,
          dosage: item.dosage || null,
          duration: item.duration || null,
          quantity: item.quantity ? parseInt(item.quantity) : undefined,
          confidence: item.confidence ? parseFloat(item.confidence) : undefined
        });

        const conf = item.confidence ? parseFloat(item.confidence) : 1.0;
        if (conf < 0.4) hasLowConfidence = true;
        overallConfidence = Math.min(overallConfidence, conf);

        // Matching Logic
        let matchType = 'None';
        let matchedProductId: number | undefined = undefined;
        let matchedMedicineObj = null;
        let matchedConfidence = 0;
        let variants: any[] = [];

        // 1. Get Candidates
        // Since the DB is small, fetching all ensures the fuzzy matcher finds the absolute best match
        // and doesn't get tricked by prefixes like "Tab " or "Cap "
        let candidates = await Medicine.findAll();

        // 2. Score Candidates
        const scoredCandidates = candidates.map(candidate => ({
          product: candidate,
          score: calculateSimilarity(item.name, candidate.name)
        })).sort((a, b) => b.score - a.score);

        if (scoredCandidates.length > 0) {
          const topMatch = scoredCandidates[0];
          
          if (topMatch.score >= 0.85) {
            matchType = 'Exact';
            matchedProductId = topMatch.product.id;
            matchedMedicineObj = topMatch.product;
            matchedConfidence = topMatch.score;
          } else if (topMatch.score >= 0.70) {
            matchType = 'Similar'; // Action Required status
            // Return top 3 variants
            variants = scoredCandidates.filter(c => c.score >= 0.70).slice(0, 3);
            matchedConfidence = topMatch.score;
          }
        }

        const matchedRecord = await MatchedProduct.create({
          prescriptionId: prescription.id,
          extractedMedicineId: extractedMed.id,
          productId: matchedProductId || undefined,
          matchType,
          confidence: matchedConfidence
        });

        matchedResults.push({
          extracted: extractedMed,
          match: matchedRecord,
          product: matchedMedicineObj,
          variants: variants.map(v => v.product)
        });
      }

      // 3. Mandatory Pharmacist Review for all prescriptions
      await prescription.update({
        status: 'Pending'
      });

      return NextResponse.json({
        success: true,
        message: 'Prescription processed successfully. Awaiting pharmacist review.',
        data: {
          prescription,
          status: 'Pending Pharmacist Review',
          metadata,
          medicines: matchedResults
        }
      }, { status: 200 });

    } catch (aiError: any) {
      console.error('AI Extraction Error:', aiError);
      // Fallback: Save as Pending for manual review
      await prescription.update({ status: 'Pending' });
      return NextResponse.json({
        success: true,
        message: 'Prescription uploaded but AI extraction failed. Added to manual review queue.',
        data: { prescription }
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const prescriptions = await Prescription.findAll({
      where: { userId: userAuth.id },
      include: [
        {
          model: ExtractedMedicine,
          as: 'extractedMedicines',
          include: [
            {
              model: MatchedProduct,
              as: 'matchedProduct',
              include: [{ model: Medicine, as: 'product' }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: prescriptions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
