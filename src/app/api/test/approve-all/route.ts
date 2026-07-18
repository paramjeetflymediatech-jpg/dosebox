export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import models from '../../../../models';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const { Prescription, Order, Notification } = models;
    
    // Find all stuck prescriptions
    const stuckPrescriptions = await Prescription.findAll({
      where: {
        status: {
          [Op.in]: ['Pending', 'Processing']
        }
      }
    });

    // Approve them
    for (const rx of stuckPrescriptions) {
      await rx.update({ status: 'Approved', pharmacistNotes: 'Auto-approved by test API' });
      
      // Update any orders that are stuck in Prescription Review for this prescription
      const orders = await Order.findAll({
        where: {
          prescriptionId: rx.id,
          status: 'Prescription Review'
        }
      });
      
      for (const order of orders) {
        await order.update({ status: 'Confirmed' });
        
        // Notify user about order confirmation
        await Notification.create({
          userId: order.userId,
          title: 'Order Confirmed',
          message: `Your order #${order.id} has been confirmed after prescription approval.`,
          read: false
        });
      }
      
      // Notify user about prescription approval
      await Notification.create({
        userId: rx.userId,
        title: 'Prescription Approved',
        message: `Your prescription uploaded for testing has been auto-approved.`,
        read: false
      });
    }

    // Just in case there are orders stuck without a linked prescription or already approved prescription
    const otherStuckOrders = await Order.findAll({
      where: {
        status: 'Prescription Review'
      }
    });
    
    for (const order of otherStuckOrders) {
      await order.update({ status: 'Confirmed' });
    }

    return NextResponse.json({
      success: true,
      message: `Auto-approved ${stuckPrescriptions.length} prescriptions and fixed ${otherStuckOrders.length + stuckPrescriptions.length} orders. You can now proceed!`,
      prescriptionsUpdated: stuckPrescriptions.length,
      ordersUpdated: otherStuckOrders.length
    });
  } catch (error: any) {
    console.error('Test API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
