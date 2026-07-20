import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { User } from '../../../../models';

export async function PUT(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth; // Return error response

    const userId = userAuth.id;
    const body = await req.json();
    
    if (!body.fcmToken) {
      return NextResponse.json({ success: false, message: 'fcmToken is required' }, { status: 400 });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    user.fcmToken = body.fcmToken;
    await user.save();

    return NextResponse.json({ success: true, message: 'FCM token updated successfully' });
  } catch (error: any) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
