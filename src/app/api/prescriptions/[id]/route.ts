import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Prescription, Notification } from '../../../../models';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    if (!['Admin', 'Pharmacist'].includes(userAuth.roleName)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const prescriptionId = params.id;
    const body = await req.json();
    const { status, adminNotes } = body;

    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription) {
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    const oldStatus = prescription.status;

    await prescription.update({
      status: status || prescription.status,
      notes: adminNotes !== undefined ? adminNotes : prescription.notes
    });

    // Notify user if status changed
    if (status && status !== oldStatus) {
      await Notification.create({
        userId: prescription.userId,
        title: 'Prescription Status Updated',
        message: `Your uploaded prescription is now marked as ${status}.`
      });
    }

    return NextResponse.json({ success: true, message: 'Prescription updated successfully', data: prescription }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
