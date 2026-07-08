import { NextRequest, NextResponse } from 'next/server';
import db from '@/models';

// PUT update an FAQ
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id: faqId } = await params;
    const body = await req.json();
    
    const faq = await db.Faq.findByPk(faqId);
    if (!faq) {
      return NextResponse.json({ success: false, message: 'FAQ not found' }, { status: 404 });
    }

    await faq.update(body);

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE an FAQ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id: faqId } = await params;
    
    const faq = await db.Faq.findByPk(faqId);
    if (!faq) {
      return NextResponse.json({ success: false, message: 'FAQ not found' }, { status: 404 });
    }

    await faq.destroy();

    return NextResponse.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
