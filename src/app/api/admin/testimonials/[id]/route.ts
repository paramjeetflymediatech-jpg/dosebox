import { NextResponse } from 'next/server';
import { Testimonial } from '@/models';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const authorName = formData.get('authorName') as string;
    const rating = parseInt(formData.get('rating') as string);
    const text = formData.get('text') as string;
    const relativeTime = formData.get('relativeTime') as string;
    const isActiveStr = formData.get('isActive') as string;
    const profileImageFile = formData.get('profileImage') as File | string | null;

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }

    let profileImagePath = testimonial.profileImage;

    if (profileImageFile && typeof profileImageFile !== 'string') {
      const bytes = await profileImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public/uploads/testimonials');
      await mkdir(uploadDir, { recursive: true });

      const ext = path.extname(profileImageFile.name) || '.png';
      const fileName = `testimonial-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      profileImagePath = `/api/file/testimonials/${fileName}`;
    } else if (typeof profileImageFile === 'string' && profileImageFile !== '') {
      profileImagePath = profileImageFile;
    } else if (profileImageFile === '') {
        profileImagePath = '';
    }

    const updateData: any = {};
    if (authorName !== null) updateData.authorName = authorName;
    if (!isNaN(rating)) updateData.rating = rating;
    if (text !== null) updateData.text = text;
    if (relativeTime !== null) updateData.relativeTime = relativeTime;
    if (isActiveStr !== null) updateData.isActive = isActiveStr === 'true';
    updateData.profileImage = profileImagePath;

    await testimonial.update(updateData);
    return NextResponse.json({ success: true, data: testimonial });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }
    await testimonial.destroy();
    return NextResponse.json({ success: true, message: 'Testimonial deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
