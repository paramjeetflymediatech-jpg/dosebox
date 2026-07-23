import { NextRequest, NextResponse } from 'next/server';
import { Doctor } from '../../../../../models';
import { authenticateJWT, authorizeRoles } from '../../../../../middleware/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership');
  if (authError) return authError;

  try {
    const resolvedParams = await params;
    const doctorId = parseInt(resolvedParams.id);
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, specialization, experience, fees, availability, rating } = body;
    
    // Process availability (ensure it is a stringified JSON array if provided as object/array)
    let processedAvailability = doctor.availability;
    if (availability !== undefined) {
      processedAvailability = typeof availability === 'string' ? availability : JSON.stringify(availability);
    }

    await doctor.update({
      name: name ?? doctor.name,
      specialization: specialization ?? doctor.specialization,
      experience: experience ?? doctor.experience,
      fees: fees ?? doctor.fees,
      availability: processedAvailability,
      rating: rating ?? doctor.rating
    });

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership');
  if (authError) return authError;

  try {
    const resolvedParams = await params;
    const doctorId = parseInt(resolvedParams.id);
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
    }

    // Safely delete related appointments to avoid foreign key constraints
    const { Appointment } = require('../../../../../models').default || require('../../../../../models');
    if (Appointment) {
      try {
        await Appointment.destroy({ where: { doctorId } });
      } catch (e) {}
    }

    await doctor.destroy();
    return NextResponse.json({ success: true, message: 'Doctor deleted' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
