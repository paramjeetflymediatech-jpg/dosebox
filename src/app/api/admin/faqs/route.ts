import { NextRequest, NextResponse } from 'next/server';
import db from '@/models';

export const dynamic = 'force-dynamic';

// GET all FAQs (including inactive)
export async function GET(req: NextRequest) {
  try {
    const faqs = await db.Faq.findAll({
      order: [['displayOrder', 'ASC'], ['id', 'ASC']]
    });
    
    return NextResponse.json({ success: true, faqs });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST create a new FAQ
export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    const { question, answer, isActive, displayOrder } = body;

    if (!question || !answer) {
      return NextResponse.json({ success: false, message: 'Question and answer are required' }, { status: 400 });
    }

    const faq = await db.Faq.create({
      question,
      answer,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    });

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
