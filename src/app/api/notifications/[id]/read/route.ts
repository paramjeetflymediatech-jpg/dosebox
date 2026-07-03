import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

const { Notification } = models;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const notification = await Notification.findOne({ where: { id, userId: authResult.id } });
    
    if (!notification) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    await notification.update({ read: true });

    return NextResponse.json({ success: true, data: notification }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
