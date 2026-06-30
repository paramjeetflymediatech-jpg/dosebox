import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Appointment } from '../../../../models';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const body = await req.json().catch(() => ({}));
    const { doctorId, appointmentDate, appointmentTime, reason } = body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const appointment = await Appointment.create({
      userId: userAuth.id,
      doctorId,
      dateTime: new Date(`${appointmentDate}T${appointmentTime}:00Z`),
      type: 'Video',
      status: 'Scheduled',
      notes: reason
    });

    return NextResponse.json({ success: true, message: 'Appointment booked successfully', data: appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
