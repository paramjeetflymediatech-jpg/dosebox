import { NextRequest, NextResponse } from 'next/server';
import { Supplier } from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const adminAuth = await authenticateJWT(req);
    if (adminAuth instanceof NextResponse) return adminAuth;
    if (adminAuth.roleName !== 'Admin' && adminAuth.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, address } = body;

    const supplier = await Supplier.findByPk(params.id);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    await supplier.update({ name, email, phone, address });
    return NextResponse.json({ success: true, data: supplier }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const adminAuth = await authenticateJWT(req);
    if (adminAuth instanceof NextResponse) return adminAuth;
    if (adminAuth.roleName !== 'Admin' && adminAuth.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const supplier = await Supplier.findByPk(params.id);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    await supplier.destroy();
    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
