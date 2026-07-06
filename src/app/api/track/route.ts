export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { UserActivity } from '../../../models';
import { authenticateJWT } from '../../../middleware/auth';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path, details, deviceType, screenResolution, language, timezone, referrer } = body;

    if (!action || !path) {
      return NextResponse.json({ success: false, message: 'Action and path are required' }, { status: 400 });
    }

    // Try to authenticate to get userId, but don't fail if not logged in
    let userId: number | undefined = undefined;
    const authResult = await authenticateJWT(req);
    if (!(authResult instanceof NextResponse) && authResult.id) {
      userId = authResult.id;
    }

    // Get or create session ID from cookies
    let sessionId = req.cookies.get('dosebox_session')?.value;
    let newCookie = false;
    
    if (!sessionId) {
      sessionId = randomUUID();
      newCookie = true;
    }

    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

    await UserActivity.create({
      userId,
      sessionId,
      action,
      path,
      details: details ? JSON.stringify(details) : undefined,
      userAgent: userAgent || undefined,
      ipAddress: ipAddress || undefined,
      deviceType: deviceType || undefined,
      screenResolution: screenResolution || undefined,
      language: language || undefined,
      timezone: timezone || undefined,
      referrer: referrer || undefined
    });

    const response = NextResponse.json({ success: true, sessionId }, { status: 201 });
    
    if (newCookie) {
      response.cookies.set('dosebox_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error tracking activity:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
