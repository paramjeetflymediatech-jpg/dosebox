export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '../../../../models';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'roleId', 'status', 'createdAt']
    });
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, roleId, status } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      roleId: roleId ? parseInt(roleId) : 2,
      status: status || 'Active'
    });

    return NextResponse.json({ success: true, message: 'User created successfully', data: { id: newUser.id } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
