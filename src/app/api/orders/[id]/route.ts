export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Order, Notification, User, DoseboxTokenTransaction } from '../../../../models';
import { sendOrderStatusEmail, sendOrderCancelledEmail } from '../../../../lib/email';
import { initiatePhonePeRefund } from '../../payments/phonepe/refund/route';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const authCheck = authorizeRoles(userAuth, 'Admin', 'Pharmacist');
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await req.json();
    const { status, paymentStatus, trackingMessage, cancelReason } = body;

    const order = await Order.findByPk(params.id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const user = await User.findByPk(order.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let updated = false;

    if (status && status !== order.status) {
      order.status = status;
      updated = true;
    }

    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      order.paymentStatus = paymentStatus;
      updated = true;
    }

    if (trackingMessage) {
      let timeline = [];
      try { timeline = JSON.parse(order.trackingTimeline || '[]'); } catch(e){}
      timeline.push({
        status: status || order.status,
        time: new Date().toISOString(),
        desc: trackingMessage
      });
      order.trackingTimeline = JSON.stringify(timeline);
      updated = true;
    }

    if (updated) {
      // ----------------------------------------------------
      // ADMIN CANCELLATION LOGIC
      // ----------------------------------------------------
      if (order.status === 'Cancelled' && !order.cancelledBy) {
        order.cancelledBy = 'admin';
        order.cancelReason = cancelReason || 'Cancelled by DoseBox Admin';
        
        // Wait for the user to login and choose their refund method (Bank vs Tokens)
        // No auto-refunding happens here.
        order.refundStatus = 'Pending User Choice';
        order.refundMethod = 'None';
        
        // Send a generic cancellation email (the refund claim email will be sent later once they claim it)
        sendOrderStatusEmail(user, order, 'Cancelled (Please choose a refund option in your account)').catch(console.error);
      } else if (status) {
        // Send normal status update email
        sendOrderStatusEmail(user, order, status).catch(console.error);
      }

      await order.save();
      
      if (status || trackingMessage) {
        await Notification.create({
          userId: order.userId,
          title: 'Order Update',
          message: `Your order #OD-${order.id} has an update: ${status || order.status}`
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully', data: order });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
