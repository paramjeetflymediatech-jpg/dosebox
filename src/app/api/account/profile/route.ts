import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { User } from '../../../../models';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const user = await User.findByPk(userAuth.id, {
      attributes: ['id', 'name', 'email', 'phone', 'avatar', 'rewardPoints']
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch profile', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const body = await req.json();
    const { name, phone, currentPassword, newPassword } = body;

    const user = await User.findByPk(userAuth.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    if (currentPassword && newPassword) {
      if (!user.password) {
        return NextResponse.json({ success: false, message: 'Account uses Google Login, cannot change password' }, { status: 400 });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 401 });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    await user.update(updates);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        rewardPoints: user.rewardPoints
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update profile', error: error.message }, { status: 500 });
  }
}
