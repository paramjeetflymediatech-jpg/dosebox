import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Notification } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth; // Return error response

    const userId = userAuth.id;

    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const userId = userAuth.id;
    let body: any = {};
    try { body = await req.json(); } catch(e){}

    if (body.alertId) {
      await Notification.update(
        { read: true },
        { where: { userId, id: body.alertId } }
      );
      return NextResponse.json({ success: true, message: 'Alert marked as read' });
    }

    // Mark all as read
    await Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );

    return NextResponse.json({ success: true, message: 'All alerts marked as read' });
  } catch (error: any) {
    console.error('Error marking alerts read:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
