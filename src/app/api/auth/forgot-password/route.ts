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

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email asynchronously in the background so it doesn't block the API response
    setTimeout(() => {
      transporter.sendMail({
        from: `"DoseBox" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset OTP - DoseBox',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <h2 style="color: #0f766e;">Password Reset Request</h2>
            <p>You requested to reset your DoseBox password. Here is your 6-digit verification code:</p>
            <div style="background-color: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px; color: #0f172a;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p style="color: #64748b; font-size: 14px;">If you did not request this, please ignore this email.</p>
          </div>
        `
      }).then(() => {
        console.log(`🔐 Sent OTP via Email to ${email}`);
      }).catch((err) => {
        console.error('Failed to send OTP email:', err);
      });
    }, 0);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent to your email successfully',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
