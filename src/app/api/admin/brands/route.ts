export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Brand } from '../../../../models';
import { authenticateJWT } from '../../../../middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const brands = await Brand.findAll({
      order: [['name', 'ASC']]
    });
    return NextResponse.json({ success: true, data: brands }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin' && authResult.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, logo } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: 'Name and slug are required' }, { status: 400 });
    }

    const brand = await Brand.create({ name, slug, description, logo });
    return NextResponse.json({ success: true, data: brand }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateJWT(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await Brand.destroy({ where: {} });
    return NextResponse.json({ success: true, message: 'All brands deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
