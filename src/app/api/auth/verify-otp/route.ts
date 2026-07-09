export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../models';
import { Op } from 'sequelize';

const { User } = models;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await User.findOne({ 
      where: { 
        email,
        resetOtp: otp,
        resetOtpExpires: {
          [Op.gt]: new Date() // Must not be expired
        }
      } 
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP verified successfully. You may now reset your password.' 
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
