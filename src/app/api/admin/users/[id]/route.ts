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

    // Delete associated records first to avoid foreign key constraints
    const relatedModels = [
      'Prescription', 'Order', 'Review', 'UserActivity', 'Address', 
      'Appointment', 'Notification', 'DraftCart', 'MobileAuthUser'
    ];

    for (const modelName of relatedModels) {
      const modelKey = modelName as keyof typeof models;
      if (models[modelKey]) {
        try {
          await (models[modelKey] as any).destroy({ where: { userId } });
        } catch (e) {
          // Ignore if the column doesn't exist or table is empty
        }
      }
    }

    // Some tables might not have standard Sequelize models loaded but still hold foreign keys
    try {
      await (models as any).sequelize.query(`DELETE FROM reward_transactions WHERE userId = ${userId}`);
    } catch (e) {}

    await user.destroy();

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
