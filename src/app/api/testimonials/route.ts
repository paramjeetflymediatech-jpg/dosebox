import { NextResponse } from 'next/server';
import { Testimonial } from '@/models';

export async function GET(req: Request) {
  try {
    const testimonials = await Testimonial.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });
    return NextResponse.json({ success: true, data: testimonials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
