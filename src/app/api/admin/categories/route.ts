export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
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
    // @ts-ignore
    if (authResult.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, image } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: 'Name and slug are required' }, { status: 400 });
    }

    const category = await Category.create({ name, slug, description, image });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
