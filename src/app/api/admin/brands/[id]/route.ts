export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Brand } from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const brandId = parseInt(id);
    const brand = await Brand.findByPk(brandId);
    
    if (!brand) {
      return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
    }

    await brand.destroy();
    return NextResponse.json({ success: true, message: 'Brand deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const brandId = parseInt(id);
    const brand = await Brand.findByPk(brandId);
    
    if (!brand) {
      return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
    }

    const body = await req.json();
    await brand.update(body);
    return NextResponse.json({ success: true, data: brand }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
