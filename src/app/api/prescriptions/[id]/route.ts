export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Prescription, Notification, ExtractedMedicine, MatchedProduct } from '../../../../models';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    if (!['Admin'].includes(userAuth.roleName)) {
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
      pharmacistNotes: adminNotes !== undefined ? adminNotes : prescription.pharmacistNotes
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

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const prescriptionId = params.id;
    const prescription = await Prescription.findByPk(prescriptionId);
    
    if (!prescription) {
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    // Only allow admin or the owner to delete
    if (prescription.userId !== userAuth.id && userAuth.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Delete dependent records first to avoid foreign key constraints
    await MatchedProduct.destroy({ where: { prescriptionId } });
    await ExtractedMedicine.destroy({ where: { prescriptionId } });

    await prescription.destroy();

    return NextResponse.json({ success: true, message: 'Prescription deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const prescriptionId = params.id;
    const prescription = await Prescription.findByPk(prescriptionId);
    
    if (!prescription) {
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    if (prescription.userId !== userAuth.id && userAuth.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: prescription }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
