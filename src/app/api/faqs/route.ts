import { NextResponse } from 'next/server';
import db from '@/models';

export async function GET() {
  try {
    const faqs = await db.Faq.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['id', 'ASC']]
    });
    
    return NextResponse.json({ success: true, faqs });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
