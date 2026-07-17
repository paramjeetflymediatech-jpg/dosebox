export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Banner } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const banners = await Banner.findAll({ order: [['createdAt', 'DESC']] });
    return NextResponse.json({ success: true, data: banners }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin' && authResult.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const formData = (await req.formData()) as any;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const type = formData.get('type') as string;
    const link = formData.get('link') as string;
    const imageFile = formData.get('image') as File | string | null;

    let bannerData: any = { title, subtitle, type, link };

    if (imageFile && typeof imageFile !== 'string') {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), 'public/uploads/banners');
      await mkdir(uploadDir, { recursive: true });
      const ext = path.extname(imageFile.name) || '.png';
      const fileName = `banner-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      bannerData.image = `/uploads/banners/${fileName}`;
    } else if (typeof imageFile === 'string' && imageFile) {
      bannerData.image = imageFile;
    }

    const banner = await Banner.create(bannerData);
    return NextResponse.json({ success: true, message: 'Banner added', data: banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

