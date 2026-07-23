import { NextRequest, NextResponse } from 'next/server';
import { Doctor } from '../../../../models';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';

export async function GET(req: NextRequest) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership');
  if (authError) return authError;

  try {
    const doctors = await Doctor.findAll({
      order: [['createdAt', 'DESC']]
    });
    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership');
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, specialization, experience, fees, availability, rating } = body;
    
    // Process availability (ensure it is a stringified JSON array if provided as object/array)
    let processedAvailability = '[]';
    if (availability) {
      processedAvailability = typeof availability === 'string' ? availability : JSON.stringify(availability);
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      experience: experience || 0,
      fees: fees || 0,
      availability: processedAvailability,
      rating: rating || 5.0
    });

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
