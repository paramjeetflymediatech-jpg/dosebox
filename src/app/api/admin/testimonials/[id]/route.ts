import { NextResponse } from 'next/server';
import { Testimonial } from '@/models';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const testimonial = await Testimonial.findByPk(params.id);
    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }
    await testimonial.update(body);
    return NextResponse.json({ success: true, data: testimonial });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const testimonial = await Testimonial.findByPk(params.id);
    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }
    await testimonial.destroy();
    return NextResponse.json({ success: true, message: 'Testimonial deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
