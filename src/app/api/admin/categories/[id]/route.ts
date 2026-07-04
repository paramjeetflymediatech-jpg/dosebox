export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Category } from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    // @ts-ignore
    if (authResult.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const categoryId = parseInt(params.id);
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    // @ts-ignore
    if (authResult.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const categoryId = parseInt(params.id);
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const body = await req.json();
    await category.update(body);
    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
