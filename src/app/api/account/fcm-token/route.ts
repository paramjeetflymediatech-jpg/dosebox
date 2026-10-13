import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { User, MobileAuthUser } from '../../../../models';

export async function PUT(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth; // Return error response

    const userId = userAuth.id;
    const body = await req.json();
    
    if (!body.fcmToken || typeof body.fcmToken !== 'string') {
      return NextResponse.json({ success: false, message: 'Valid fcmToken is required' }, { status: 400 });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const cleanToken = body.fcmToken.trim();
    user.fcmToken = cleanToken;
    await user.save();

    const userType: 'customer' | 'admin' = (user.roleId === 1 || user.roleId === 4 || user.roleId === 5) ? 'admin' : 'customer';

    // Also sync to MobileAuthUser
    await MobileAuthUser.update(
      { pushToken: cleanToken, pushTokenUpdatedAt: new Date(), userType },
      { where: { userId } }
    ).catch((e: any) => console.error('Error updating MobileAuthUser token:', e));

    return NextResponse.json({ success: true, message: 'FCM token updated successfully' });
  } catch (error: any) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
