import { NextRequest, NextResponse } from 'next/server';
import { Supplier } from '../../../../models';
import { authenticateJWT } from '../../../../middleware/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await authenticateJWT(req);
    if (adminAuth instanceof NextResponse) return adminAuth;
    if (adminAuth.roleName !== 'Admin' && adminAuth.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const suppliers = await Supplier.findAll({
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: suppliers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await authenticateJWT(req);
    if (adminAuth instanceof NextResponse) return adminAuth;
    if (adminAuth.roleName !== 'Admin' && adminAuth.roleName !== 'SuperAdmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, address } = body;

    const supplier = await Supplier.create({ name, email, phone, address });
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
