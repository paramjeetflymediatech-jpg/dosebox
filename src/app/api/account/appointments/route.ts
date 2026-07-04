import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Appointment, Doctor } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const appointments = await Appointment.findAll({
      where: { userId: userAuth.id },
      include: [{ model: Doctor, as: 'consultingDoctor' }],
      order: [['dateTime', 'DESC']]
    });

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
