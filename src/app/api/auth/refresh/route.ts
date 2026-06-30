import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { User, Role } from '../../../../models';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforauth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'Refresh token is required' }, { status: 400 });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number };
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Session is invalid or user suspended' }, { status: 401 });
    }

    const roleName = user.role ? (user.role as any).name : 'Customer';

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId, roleName },
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRE || '1h') as any }
    );

    return NextResponse.json({
      success: true,
      accessToken
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid or expired refresh token' }, { status: 403 });
  }
}
