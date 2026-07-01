import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { User, Role } from '../../../../models';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforauth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { googleId, email, name, avatar } = body;

    if (!googleId || !email || !name) {
      return NextResponse.json({ success: false, message: 'Google authentication details missing' }, { status: 400 });
    }

    let user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        roleId: 3, // Customer
        status: 'active'
      });
      
      user = await User.findByPk(user.id, {
        include: [{ model: Role, as: 'role' }]
      }) as any;
    } else {
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    if (user!.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Account is suspended' }, { status: 403 });
    }

    const roleName = user!.role ? (user!.role as any).name : 'Customer';

    const accessToken = jwt.sign(
      { id: user!.id, email: user!.email, roleId: user!.roleId, roleName },
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRE || '1h') as any }
    );

    const refreshToken = jwt.sign(
      { id: user!.id },
      JWT_REFRESH_SECRET,
      { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as any }
    );

    return NextResponse.json({
      success: true,
      message: 'Google login successful',
      accessToken,
      refreshToken,
      user: {
        id: user!.id,
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
        avatar: user!.avatar,
        rewardPoints: user!.rewardPoints,
        role: roleName
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
