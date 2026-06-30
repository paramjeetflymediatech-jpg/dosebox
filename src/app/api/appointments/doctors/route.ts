import { NextRequest, NextResponse } from 'next/server';
import { User, Role } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const doctors = await User.findAll({
      include: [{ model: Role, as: 'role', where: { name: 'Doctor' } }],
      attributes: ['id', 'name', 'email', 'phone', 'specialization', 'experienceYears', 'consultationFee']
    });

    return NextResponse.json({ success: true, data: doctors }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
