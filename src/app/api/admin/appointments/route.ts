import { NextRequest, NextResponse } from 'next/server';
import { Appointment, Doctor, User } from '../../../../models';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';

export async function GET(req: NextRequest) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
  if (authError) return authError;

  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Doctor, as: 'consultingDoctor' },
        { model: User, as: 'patient', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['dateTime', 'DESC']]
    });
    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
