export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Category } from '../../../../models';
import { authenticateJWT } from '../../../../middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | string | null;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: 'Name and slug are required' }, { status: 400 });
    }

    let imagePath = '';

    if (imageFile && typeof imageFile !== 'string') {
      // It's a file upload
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public/uploads/categories');
      await mkdir(uploadDir, { recursive: true });

      // Generate a unique filename
      const ext = path.extname(imageFile.name) || '.png';
      const fileName = `${slug}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      imagePath = `/uploads/categories/${fileName}`;
    } else if (typeof imageFile === 'string') {
      // It's just a string (fallback/legacy)
      imagePath = imageFile;
    }

    const category = await Category.create({ name, slug, description, image: imagePath });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
