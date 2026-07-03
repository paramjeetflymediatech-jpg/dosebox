export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../middleware/auth';
import { Supplier } from '../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth instanceof NextResponse) return roleAuth;

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
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth instanceof NextResponse) return roleAuth;

    const body = await req.json();
    const { name, email, phone, address } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, message: 'Name, email, and phone are required' }, { status: 400 });
    }

    const newSupplier = await Supplier.create({
      name,
      email,
      phone,
      address
    });

    return NextResponse.json({ success: true, message: 'Supplier created successfully', data: newSupplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
