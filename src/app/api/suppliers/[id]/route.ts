import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Supplier } from '../../../../models';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth instanceof NextResponse) return roleAuth;

    const resolvedParams = await params;
    const supplierId = parseInt(resolvedParams.id, 10);
    const supplier = await Supplier.findByPk(supplierId);
    
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    const body = await req.json();
    await supplier.update(body);

    return NextResponse.json({ success: true, message: 'Supplier updated successfully', data: supplier }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth instanceof NextResponse) return roleAuth;

    const resolvedParams = await params;
    const supplierId = parseInt(resolvedParams.id, 10);
    const supplier = await Supplier.findByPk(supplierId);
    
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    await supplier.destroy();

    return NextResponse.json({ success: true, message: 'Supplier deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
