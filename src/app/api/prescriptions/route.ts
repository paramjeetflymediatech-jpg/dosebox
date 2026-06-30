import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../middleware/auth';
import { Prescription, Medicine, User } from '../../../models';
import { saveUploadFile } from '../../../middleware/upload';
import { Op } from 'sequelize';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Prescription file is required' }, { status: 400 });
    }

    const fileUrl = await saveUploadFile(file);
    const fileType = file.name ? file.name.split('.').pop() || 'png' : 'png';

    const prescription = await Prescription.create({
      userId: userAuth.id,
      fileUrl,
      fileType,
      notes,
      status: 'Pending'
    });

    let extractedMedicines: any[] = [];
    
    // Only run OCR on images
    if (['jpg', 'jpeg', 'png', 'webp'].includes(fileType.toLowerCase())) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Dynamically load tesseract to bypass Next.js Webpack mangling
        const Tesseract = eval(`require('tesseract.js')`);
        
        // Run OCR
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        
        // Extract potential medicine names (words > 4 letters)
        const words = text.match(/[A-Za-z]{4,}/g) || [];
        const uniqueWords = [...new Set(words.map((w: string) => w.toLowerCase()))];
        
        if (uniqueWords.length > 0) {
          const likeConditions = uniqueWords.map(word => ({
            name: { [Op.like]: `%${word}%` }
          }));
          
          extractedMedicines = await Medicine.findAll({
            where: {
              [Op.or]: likeConditions
            },
            limit: 8
          });
        }
      } catch (ocrErr) {
        console.error('OCR Scanning failed:', ocrErr);
        // Continue even if OCR fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Prescription uploaded successfully', 
      data: prescription,
      extractedMedicines
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    // Only allow Admin or Pharmacist to view all prescriptions
    if (!['Admin', 'Pharmacist'].includes(userAuth.roleName)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const prescriptions = await Prescription.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: prescriptions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
