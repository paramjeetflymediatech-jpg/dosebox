export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import models from '../../../../models';

const { User, Role, MobileAuthUser } = models;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforauth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Account is suspended' }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    const roleName = user.role ? (user.role as any).name : 'Customer';

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId, roleName },
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRE || '1h') as any }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as any }
    );

    // Track mobile auth device
    if (body.device_id || body.device_platform) {
      console.log('Mobile login detected!', { device_id: body.device_id, device_platform: body.device_platform });
      try {
        const existingDevice = await MobileAuthUser.findOne({
          where: { userId: user.id, deviceId: body.device_id || 'unknown' }
        });

        const deviceData = {
          refreshToken,
          refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          pushToken: body.push_token,
          pushTokenPlatform: body.device_platform,
          deviceName: body.device_name,
          devicePlatform: body.device_platform,
          osVersion: body.os_version,
          appVersion: body.app_version,
          lastLogin: new Date()
        };

        if (existingDevice) {
          console.log('Updating existing mobile device record...');
          await existingDevice.update(deviceData);
        } else {
          console.log('Creating new mobile device record...');
          await MobileAuthUser.create({
            userId: user.id,
            userType: 'customer',
            deviceId: body.device_id || 'unknown',
            ...deviceData
          });
        }
        console.log('Mobile auth tracked successfully!');
      } catch (err) {
        console.error('Error tracking mobile auth user:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        rewardPoints: user.rewardPoints,
        role: roleName
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
