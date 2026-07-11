import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../../models';
import bcrypt from 'bcryptjs';

const { User } = models;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);
    const body = await req.json();
    const { name, email, phone, roleId, status, password } = body;

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (roleId !== undefined) updates.roleId = parseInt(roleId);
    if (status !== undefined) updates.status = status;

    if (password && password.trim() !== '') {
      updates.password = await bcrypt.hash(password, 10);
    }

    await user.update(updates);

    return NextResponse.json({ success: true, message: 'User updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);
    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Soft delete the user by updating status
    await user.update({ status: 'deleted' });

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
