export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../models';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const { User } = models;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, otp, password } = body;

    if (!email || !otp || !password) {
      return NextResponse.json({ success: false, message: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters long' }, { status: 400 });
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password and clear the OTP fields
    await user.update({
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpires: null
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
