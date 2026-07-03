export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import models from '../../../models';
import { authenticateJWT } from '../../../middleware/auth';

const { Notification } = models;

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    const notifications = await Notification.findAll({
      where: { userId: authResult.id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
