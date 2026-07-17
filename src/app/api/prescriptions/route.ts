export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateJWT } from "../../../middleware/auth";
import {
 Prescription,
 ExtractedMedicine,
 MatchedProduct,
 Medicine,
 User,
} from "../../../models";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { calculateSimilarity } from "../../../utils/fuzzyMatch";


function delay(ms: number) {
 return new Promise((resolve) => setTimeout(resolve, ms));
}
async function generateWithRetry(
 model: any,
 content: any[],
 retries = 3
) {
 let lastError;




 for (let i = 0; i < retries; i++) {
   try {
     return await model.generateContent(content);
   } catch (error) {
     lastError = error;
     console.log(`Gemini Retry ${i + 1}/${retries}`);
     if (i < retries - 1) {
       await delay(1500 * (i + 1));
     }
   }
 }
 throw lastError;
}
function normalizeMedicineName(name: string) {
 return name
   .toLowerCase()
   .replace(/\b(tab|tablet|cap|capsule|inj|injection|syrup|cream|gel)\b/g, "")
   .replace(/[^\w]/g, "")
   .trim();
}
function getBestSimilarity(
 extractedName: string,
 medicine: any
) {
 const query = normalizeMedicineName(extractedName);
 const values = [
   medicine.name,
   medicine.genericName,
   medicine.brandName,
 ].filter(Boolean);


 let bestScore = 0;


 for (const value of values) {
   const score = calculateSimilarity(
     query,
     normalizeMedicineName(value)
   );


   if (score > bestScore) {
     bestScore = score;
   }
 }
 return bestScore;
}




export async function POST(req: NextRequest) {
 try {
   // ============================
   // Authenticate User
   // ============================
   const userAuth = await authenticateJWT(req);
   if (userAuth instanceof NextResponse) {
     return userAuth;
   }
   const userId = userAuth.id;
   const dbUser = await User.findByPk(userId);
   const accountName = dbUser?.name || "";
   const accountAge = dbUser?.age
     ? `${dbUser.age} yrs`
     : "";


   // ============================
   // Read Form Data
   // ============================


   const formData = (await req.formData()) as any;
   const file = (formData as any).get("file") as File;


   if (!file) {
     return NextResponse.json(
       {
         success: false,
         message: "No prescription uploaded.",
       },
       {
         status: 400,
       }
     );
   }


   // ============================
   // Validate File Type
   // ============================
   const allowedMimeTypes = [
     "image/jpeg",
     "image/png",
     "image/webp",
     "image/heic",
     "image/heif",
     "application/pdf",
   ];


   if (!allowedMimeTypes.includes(file.type)) {
     return NextResponse.json(
       {
         success: false,
         message:
           "Only JPG, PNG, WEBP, HEIC and PDF are allowed.",
       },
       {
         status: 400,
       }
     );
   }


   // ============================
   // Validate File Size
   // ============================


   const MAX_SIZE = 5 * 1024 * 1024;


   if (file.size > MAX_SIZE) {
     return NextResponse.json(
       {
         success: false,
         message: "Maximum upload size is 5MB.",
       },
       {
         status: 400,
       }
     );
   }
   // ============================
   // Create Upload Directory
   // ============================


   const uploadDir = path.join(
     process.cwd(),
     "public",
     "uploads",
     "prescriptions"
   );
   if (!fs.existsSync(uploadDir)) {
     fs.mkdirSync(uploadDir, {
       recursive: true,
     });
   }


   // ============================
   // Generate File Name
   // ============================


   const extension =
     file.name.split(".").pop()?.toLowerCase() ||
     (file.type === "application/pdf"
       ? "pdf"
       : "jpg");


   const fileName = `rx_${userId}_${Date.now()}.${extension}`;
   const filePath = path.join(
     uploadDir,
     fileName
   );


   // ============================
   // Save File
   // ============================


   const arrayBuffer = await file.arrayBuffer();
   const buffer = Buffer.from(arrayBuffer);
   await fs.promises.writeFile(
     filePath,
     buffer
   );
   const fileUrl = `/uploads/prescriptions/${fileName}`;


   // ============================
   // Create Prescription Record
   // ============================


   const prescription =
     await Prescription.create({
       userId,
       fileUrl,
       status: "Processing",
     });
   const isPDF =
     file.type === "application/pdf";


   try {


     // ============================
     // Gemini
     // ============================


     const genAI =
       new GoogleGenerativeAI(
         process.env.GEMINI_API_KEY!
       );
     const model =
       genAI.getGenerativeModel({
         model: "gemini-2.5-flash",
         generationConfig: {
           temperature: 0.1,
           topP: 0.8,
           topK: 20,
           maxOutputTokens: 4096,
           responseMimeType:
             "application/json",
           responseSchema: {
             type: SchemaType.OBJECT,
             properties: {
               patientName: {
                 type: SchemaType.STRING,
                 nullable: true,
               },
               patientAge: {
                 type: SchemaType.STRING,
                 nullable: true,
               },
               doctorName: {
                 type: SchemaType.STRING,
                 nullable: true,
               },
               doctorSpecialty: {
                 type: SchemaType.STRING,
                 nullable: true,
               },
               medicines: {
                 type: SchemaType.ARRAY,
                 items: {
                   type: SchemaType.OBJECT,
                   properties: {
                     name: {
                       type: SchemaType.STRING,
                     },
                     strength: {
                       type: SchemaType.STRING,
                       nullable: true,
                     },
                     dosage: {
                       type: SchemaType.STRING,
                       nullable: true,
                     },
                     duration: {
                       type: SchemaType.STRING,
                       nullable: true,
                     },
                     quantity: {
                       type: SchemaType.NUMBER,
                       nullable: true,
                     },
                     confidence: {
                       type: SchemaType.NUMBER,
                     },
                   },
                   required: [
                     "name",
                     "confidence",
                   ],
                 },
               },
             },
             required: [
               "medicines",
             ],
           },
         },
       });




     const prompt = `
You are an expert pharmacist and prescription OCR assistant.




Read the uploaded prescription carefully.




Rules:




- Read every medicine.
- Ignore handwriting quality.
- Never invent medicine names.
- Correct only obvious OCR mistakes.
- Return NULL if unreadable.
- Preserve medicine names.
- Extract patient name.
- Extract patient age.
- Extract doctor name.
- Extract doctor specialty.




For every medicine return:




- name
- strength
- dosage
- duration
- quantity
- confidence




Confidence:




1.0 = perfectly readable




0.95 = very clear




0.85 = readable




0.70 = partially readable




0.50 = difficult




Never output markdown.




Return ONLY JSON.
`;
     const imagePart = {
       inlineData: {
         mimeType: isPDF
           ? "application/pdf"
           : file.type,
         data: buffer.toString("base64"),
       },
     };


     const result =
       await generateWithRetry(
         model,
         [
           prompt,
           imagePart,
         ]
       );


     const responseText = result.response.text();
     let extractedData: any;
     try {
       extractedData = JSON.parse(responseText);
     } catch (err) {
       console.error(responseText);
       throw new Error(
         "Gemini returned invalid JSON."
       );
     }
     // ============================================
     // Parse AI Response
     // ============================================




     const medicinesList = Array.isArray(extractedData)
       ? extractedData
       : extractedData.medicines || [];
     let patientName = extractedData.patientName;
     if (
       !patientName ||
       patientName.toLowerCase().includes("unknown")
     ) {
       patientName = accountName || "Unknown Patient";
     }


     const metadata = {
       patientName,
       patientAge:
         extractedData.patientAge ||
         accountAge ||
         null,
       doctorName:
         extractedData.doctorName ||
         null,
       doctorSpecialty:
         extractedData.doctorSpecialty ||
         null,
     };


     // ============================================
     // Fetch Medicine Catalog Once
     // ============================================


     const medicineCatalog = await Medicine.findAll();
     const matchedResults = [];
     let overallConfidence = 1;
     let hasLowConfidence = false;
     // ============================================
     // Process Each Medicine
     // ============================================




     for (const item of medicinesList) {
       if (!item.name) continue;
       const confidence =
         Number(item.confidence || 0.5);
       overallConfidence = Math.min(
         overallConfidence,
         confidence
       );
       if (confidence < 0.40) {
         hasLowConfidence = true;
       }


       // ==========================================
       // Save Extracted Medicine
       // ==========================================


       const extractedMedicine =
         await ExtractedMedicine.create({
           prescriptionId:
             prescription.id,
           medicineName:
             item.name,
           strength:
             item.strength || null,
           dosage:
             item.dosage || null,
           duration:
             item.duration || null,
           quantity:
             item.quantity
               ? Number(item.quantity)
               : undefined,
           confidence,
         });


       // ==========================================
       // Find Best Matches
       // ==========================================


       const rankedMatches =
         medicineCatalog
           .map((medicine: any) => {
             const scores = [];
             if (medicine.name) {
               scores.push(
                 calculateSimilarity(
                   normalizeMedicineName(
                     item.name
                   ),
                   normalizeMedicineName(
                     medicine.name
                   )
                 )
               );
             }
             if (medicine.genericName) {
               scores.push(
                 calculateSimilarity(
                   normalizeMedicineName(
                     item.name
                   ),
                   normalizeMedicineName(
                     medicine.genericName
                   )
                 )
               );
             }
             if (medicine.brandName) {
               scores.push(
                 calculateSimilarity(
                   normalizeMedicineName(
                     item.name
                   ),
                   normalizeMedicineName(
                     medicine.brandName
                   )
                 )
               );
             }
             if (medicine.composition) {
               scores.push(
                 calculateSimilarity(
                   normalizeMedicineName(
                     item.name
                   ),
                   normalizeMedicineName(
                     medicine.composition
                   )
                 )
               );
             }
             if (medicine.manufacturer) {
               scores.push(
                 calculateSimilarity(
                   normalizeMedicineName(
                     item.name
                   ),
                   normalizeMedicineName(
                     medicine.manufacturer
                   )
                 )
               );
             }
             return {
               medicine,
               score: Math.max(...scores),
             };
           })
           .sort(
             (a, b) => b.score - a.score
           );


       const best =
         rankedMatches[0];
       let matchType = "None";
       let matchedMedicine = null;
       let matchedProductId:
         number | undefined;
       let matchedConfidence = 0;
       let variants: any[] = [];
       // ==========================================
       // Exact Match
       // ==========================================


       if (
         best &&
         best.score >= 0.92
       ) {
         matchType = "Exact";
         matchedMedicine =
           best.medicine;
         matchedProductId =
           best.medicine.id;
         matchedConfidence =
           best.score;
       }
       // ==========================================
       // Similar Match
       // ==========================================


       else if (
         best &&
         best.score >= 0.75
       ) {
         matchType = "Similar";
         matchedConfidence =
           best.score;
         variants =
           rankedMatches
             .slice(0, 5)
             .map((x) => x.medicine);
       }
       // ==========================================
       // Save Matched Product
       // ==========================================


       const matchedRecord =
         await MatchedProduct.create({
           prescriptionId:
             prescription.id,
           extractedMedicineId:
             extractedMedicine.id,
           productId:
             matchedProductId,
           matchType,
           confidence:
             matchedConfidence,
         });


       matchedResults.push({
         extracted:
           extractedMedicine,
         match:
           matchedRecord,
         product:
           matchedMedicine,
         variants,
       });


     }      // ==========================================
     // Decide Final Prescription Status
     // ==========================================
     let prescriptionStatus = "Pending";
     if (
       matchedResults.length > 0 &&
       !hasLowConfidence &&
       overallConfidence >= 0.90
     ) {
       prescriptionStatus = "Verified";
     }
     if (hasLowConfidence) {
       prescriptionStatus = "Manual Review";
     }
     await prescription.update({
       status: prescriptionStatus,
     });


     // ==========================================
     // Response
     // ==========================================


     return NextResponse.json(
       {
         success: true,
         message:
           prescriptionStatus === "Verified"
             ? "Prescription processed successfully."
             : prescriptionStatus === "Manual Review"
               ? "Prescription uploaded. Manual pharmacist review required."
               : "Prescription uploaded successfully.",
         data: {
           prescription,
           status: prescriptionStatus,
           metadata,
           overallConfidence,
           medicines: matchedResults,
         },
       },
       {
         status: 200,
       }
     );
   } catch (aiError: any) {
     console.error(
       "Gemini Extraction Error:",
       aiError
     );
     await prescription.update({
       status: "Manual Review",
     });


     return NextResponse.json(
       {
         success: true,
         message:
           "Prescription uploaded successfully but AI extraction failed. Added to pharmacist review queue.",
         data: {
           prescription,
           status: "Manual Review",
         },
       },
       {
         status: 200,
       }
     );
   }
 } catch (error: any) {
   console.error(
     "Prescription Upload Error:",
     error
   );
   return NextResponse.json(
     {
       success: false,
       message:
         error.message ||
         "Internal Server Error",
     },
     {
       status: 500,
     }
   );
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



