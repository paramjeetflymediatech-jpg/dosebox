import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';
import sequelize from '../../../../../config/database';

const { Prescription, DraftCart, DraftCartItem, Notification, AuditLog } = models;

export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) {
      await transaction.rollback();
      return authResult;
    }
    
    if (authResult.roleName !== 'admin') {
      await transaction.rollback();
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { prescriptionId, userId, notes, items } = body;

    if (!prescriptionId || !userId || !items || items.length === 0) {
      await transaction.rollback();
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription) {
      await transaction.rollback();
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    // 1. Create Draft Cart
    const draftCart = await DraftCart.create({
      userId,
      prescriptionId,
      status: 'approved'
    }, { transaction });

    // 2. Create Draft Cart Items
    const cartItemsData = items.map((i: any) => ({
      draftCartId: draftCart.id,
      medicineId: i.medicineId,
      quantity: i.quantity,
      price: i.price,
      type: i.type
    }));
    await DraftCartItem.bulkCreate(cartItemsData, { transaction });

    // 3. Update Prescription Status
    await prescription.update({
      status: 'Approved',
      pharmacistNotes: notes || ''
    }, { transaction });

    // 4. Create Notification for Customer
    await Notification.create({
      userId,
      title: 'Prescription Approved',
      message: `Your prescription #${prescriptionId} has been verified! Your custom cart is ready for checkout.`,
      read: false
    }, { transaction });

    // 5. Create Audit Log
    await AuditLog.create({
      adminId: authResult.id,
      prescriptionId,
      action: 'APPROVE_DRAFT_CART',
      details: JSON.stringify({ itemCount: items.length, notes })
    }, { transaction });

    await transaction.commit();
    return NextResponse.json({ success: true, message: 'Draft Cart created and approved successfully' }, { status: 200 });

  } catch (error: any) {
    await transaction.rollback();
    console.error('Approve Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
