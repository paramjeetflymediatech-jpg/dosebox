import { NextRequest, NextResponse } from 'next/server';
import { User, Role } from '../../../../../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforauth';

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nk.socialflymediatech.com';
  try {
    const formData = (await req.formData()) as any;
    const credential = (formData as any).get('credential') as string;

    if (!credential) {
      return NextResponse.redirect(new URL('/?error=NoCredential', baseUrl));
    }

    // Decode JWT (Google's credential) without external library
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(jsonPayload);

    const { sub: googleId, email, name, picture: avatar } = payload;

    if (!googleId || !email || !name) {
      return NextResponse.redirect(new URL('/?error=InvalidGooglePayload', baseUrl));
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
        roleId: 2, // Customer
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
    if (user?.status?.trim().toLowerCase() !== 'active') {
      return NextResponse.redirect(new URL('/?error=AccountSuspended', baseUrl));
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

    const userData = {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      phone: user!.phone,
      avatar: user!.avatar,
      doseboxTokens: user!.doseboxTokens,
      role: roleName
    };

    // Redirect to frontend success page
    const redirectUrl = new URL('/auth/success', baseUrl);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('user', JSON.stringify(userData));

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google Callback Error:', error);
    return NextResponse.redirect(new URL('/?error=GoogleLoginFailed', baseUrl));
  }
}
