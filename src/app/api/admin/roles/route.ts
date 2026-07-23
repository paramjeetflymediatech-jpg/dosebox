export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Role } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const authCheck = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
    if (authCheck instanceof NextResponse) return authCheck;

    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const authCheck = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Role name is required' }, { status: 400 });
    }

    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return NextResponse.json({ success: false, message: 'Role already exists' }, { status: 400 });
    }

    const role = await Role.create({ name });
    return NextResponse.json({ success: true, data: role, message: 'Role created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
