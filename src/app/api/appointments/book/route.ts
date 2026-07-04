export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Appointment } from '../../../../models';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const body = await req.json().catch(() => ({}));
    const { doctorId, dateTime, type, notes } = body;

    if (!doctorId || !dateTime) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const appointment = await Appointment.create({
      userId: userAuth.id,
      doctorId,
      dateTime: new Date(dateTime),
      type: type || 'Video',
      status: 'Scheduled',
      notes: notes || ''
    });

    return NextResponse.json({ success: true, message: 'Appointment booked successfully', data: appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
