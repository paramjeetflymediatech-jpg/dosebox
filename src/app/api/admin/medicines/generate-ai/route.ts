import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const prompt = `
      You are a specialized medical content writer for a digital pharmacy. 
      Write high-quality, professional, and medically accurate content for the following medicine:
      - Brand Name: ${name}
      - Generic Name: ${genericName}
      - Manufacturer: ${manufacturer || 'Unknown'}
      - Composition: ${composition || 'Unknown'}
      - Dosage: ${dosage || 'Unknown'}

      Output strictly valid JSON with NO markdown formatting, NO backticks, NO "json" word at the start. 
      The JSON must perfectly match this structure exactly:
      {
        "description": "A comprehensive paragraph describing what this medicine is and what it is used for.",
        "sideEffects": "A bulleted or paragraph list of common side effects.",
        "storageInstructions": "Brief instructions on how to store the medicine.",
        "sections": [
          {
            "title": "Uses",
            "content": "Detailed content about the uses of the medicine."
          },
          {
            "title": "How it works",
            "content": "Explanation of the mechanism of action."
          },
          {
            "title": "Safety Advice",
            "content": "Content about pregnancy, alcohol, driving, kidney/liver warnings."
          }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up potential markdown blocks if the model ignores the instruction
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(text);
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
