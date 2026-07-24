import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Medicine, MedicineSection } from '../../../../../models';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    // Only Admin, Leadership, Medico, Pharmacist, SuperAdmin can generate content
    const authCheck = authorizeRoles(authResult, 'Admin', 'Medico', 'Pharmacist', 'SuperAdmin', 'Leadership');
    if (authCheck instanceof NextResponse) return authCheck;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, message: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { name, genericName, manufacturer, composition, dosage } = body;

    if (!name || !genericName) {
      return NextResponse.json({ success: false, message: 'Medicine name and generic name are required.' }, { status: 400 });
    }

    // Check if medicine already exists and has sections
    const existingMed = await (Medicine as any).findOne({
      where: { name },
      include: [{ model: MedicineSection, as: 'sections' }]
    });

    if (existingMed && existingMed.sections && existingMed.sections.length > 0) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Medicine already has generated sections.',
        data: {
          sections: existingMed.sections,
          aiModelUsed: existingMed.aiModelUsed,
          promptVersion: existingMed.promptVersion,
          contentStatus: existingMed.contentStatus
        }
      }, { status: 200 });
    }

    const prompt = `
      You are a specialized medical content writer for a digital pharmacy. 
      Write high-quality, professional, and medically accurate content for the following medicine:
      - Brand Name: ${name}
      - Generic Name: ${genericName}
      - Manufacturer: ${manufacturer || 'Unknown'}
      - Composition: ${composition || 'Unknown'}
      - Dosage: ${dosage || 'Unknown'}

      Output strictly valid JSON with NO markdown formatting, NO backticks, NO "json" word at the start. 
      The JSON must perfectly match this structure exactly, providing only the "sections" array. Make sure the content is detailed and formatted well with HTML tags (like <p>, <ul>, <li>, <strong>) as it will be rendered in a rich text editor.
      {
        "sections": [
          { "title": "Introduction", "content": "Detailed introduction to the medicine." },
          { "title": "Uses", "content": "What the medicine is used for." },
          { "title": "How ${name} Works", "content": "Mechanism of action." },
          { "title": "Interaction with Other Drugs", "content": "Potential drug interactions." },
          { "title": "Storage Conditions", "content": "How to properly store it." },
          { "title": "How to Use ${name}", "content": "Dosage and administration instructions." },
          { "title": "Safety Advices", "content": "Warnings about pregnancy, alcohol, driving, kidney/liver etc." },
          { "title": "Side Effects", "content": "Common and severe side effects." },
          { "title": "Frequently Asked Questions (FAQs)", "content": "Common questions and answers." }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean up potential markdown blocks if the model ignores the instruction
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(text);
      parsedData.aiModelUsed = 'gemini-2.5-flash';
      parsedData.promptVersion = 'v1';
      parsedData.contentStatus = 'Draft';
    } catch (parseError) {
      console.error('Failed to parse Gemini output:', text);
      return NextResponse.json({ success: false, message: 'Failed to parse AI generated content.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsedData }, { status: 200 });
  } catch (error: any) {
    console.error('[AI GENERATION ERROR]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
