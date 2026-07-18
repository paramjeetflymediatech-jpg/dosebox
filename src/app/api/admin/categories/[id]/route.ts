export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Category } from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin' && authResult.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    await category.destroy();
    return NextResponse.json({ success: true, message: 'Category deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin' && authResult.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const formData = (await req.formData()) as any;
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | string | null;

    let updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== null) updateData.description = description;

    if (imageFile && typeof imageFile !== 'string') {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), 'public/uploads/categories');
      await mkdir(uploadDir, { recursive: true });
      const ext = path.extname(imageFile.name) || '.png';
      const fileName = `${slug || category.slug}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      updateData.image = `/api/file/categories/${fileName}`;
    } else if (typeof imageFile === 'string' && imageFile) {
      updateData.image = imageFile;
    }

    await category.update(updateData);
    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
