import { NextResponse } from 'next/server';
import { Testimonial } from '@/models';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    const formData = await req.formData();
    const authorName = formData.get('authorName') as string;
    const rating = parseInt(formData.get('rating') as string) || 5;
    const text = formData.get('text') as string;
    const relativeTime = formData.get('relativeTime') as string;
    const isActive = formData.get('isActive') === 'true';
    const profileImageFile = formData.get('profileImage') as File | string | null;

    let profileImagePath = '';

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
    } else if (typeof profileImageFile === 'string') {
      profileImagePath = profileImageFile;
    }

    const testimonial = await Testimonial.create({
      authorName,
      rating,
      text,
      relativeTime,
      profileImage: profileImagePath,
      isActive
    });

    return NextResponse.json({ success: true, data: testimonial });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
