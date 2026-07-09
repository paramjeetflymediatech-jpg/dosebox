export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../models';

const { User } = models;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // For security, do not reveal whether the email exists. 
      // But for development, we will say it.
      return NextResponse.json({ success: false, message: 'No user found with that email' }, { status: 404 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 15 minutes from now
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      resetOtp: otp,
      resetOtpExpires: expires
    });

    // In a real application, you would send this via Email or SMS here.
    console.log(`\n\n==============================================`);
    console.log(`🔐 OTP for ${email}: ${otp}`);
    console.log(`==============================================\n\n`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // We return the OTP in the response for dev purposes so the mobile app can auto-fill or log it easily.
      // Remove this in production!
      _dev_otp: otp 
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
