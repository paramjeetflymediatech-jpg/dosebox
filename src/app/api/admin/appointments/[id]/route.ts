import { NextRequest, NextResponse } from 'next/server';
import { Appointment } from '../../../../../models';
import { authenticateJWT, authorizeRoles } from '../../../../../middleware/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
  if (authError) return authError;

  try {
    const { id } = await params;
    const appointmentId = parseInt(id);
    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status, meetLink, notes } = body;

    await appointment.update({
      status: status ?? appointment.status,
      meetLink: meetLink ?? appointment.meetLink,
      notes: notes ?? appointment.notes
    });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
