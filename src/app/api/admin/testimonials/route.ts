import { NextResponse } from 'next/server';
import { Testimonial } from '@/models';

export async function GET(req: Request) {
  try {
    const testimonials = await Testimonial.findAll({
      order: [['createdAt', 'DESC']]
    });
    return NextResponse.json({ success: true, data: testimonials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const testimonial = await Testimonial.create(body);
    return NextResponse.json({ success: true, data: testimonial });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
