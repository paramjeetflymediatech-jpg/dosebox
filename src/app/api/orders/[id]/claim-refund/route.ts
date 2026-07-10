import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Order, User, DoseboxTokenTransaction } from '../../../../../models';
import { sendOrderCancelledEmail } from '../../../../../lib/email';
import { initiatePhonePeRefund } from '../../../payments/phonepe/refund/route';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const { refundMethod } = body; // refundMethod: 'bank' | 'tokens'

    const order = await Order.findByPk(orderId);
    if (!order || order.userId !== userAuth.id) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'Cancelled' || order.cancelledBy !== 'admin' || order.refundStatus !== 'Pending User Choice') {
      return NextResponse.json({ success: false, message: 'This order is not eligible for a refund claim' }, { status: 400 });
    }

    const user = await User.findByPk(userAuth.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let finalTokensGranted = 0;
    let actualRefundMethod = refundMethod;
    let refundStatus = 'Processed';

    const orderAmount = Number(order.finalAmount);
    const bonusTokens = orderAmount < 500 ? 50 : 100;

    if (refundMethod === 'tokens') {
      // NOTE: NO 2-TIME LIMIT FOR ADMIN CANCEL
      // For COD, they haven't paid, so they only get the bonus tokens
      finalTokensGranted = order.paymentMethod === 'COD' ? bonusTokens : orderAmount + bonusTokens;
      
      // Update User
      await user.update({
        doseboxTokens: (user.doseboxTokens || 0) + finalTokensGranted
      });

      // Log Transaction
      await DoseboxTokenTransaction.create({
        userId: user.id,
        orderId: order.id,
        type: 'Refund',
        tokens: finalTokensGranted,
        bonusTokens: bonusTokens,
        description: `Refund for Cancelled Order #${order.id} (Admin Fault)`
      });

    } else if (refundMethod === 'bank') {
      // Trigger Bank Refund via PhonePe if payment was online
      if (order.paymentMethod === 'PhonePe' && order.transactionId && order.paymentStatus === 'Paid') {
        refundStatus = 'Pending';
        const refundResult = await initiatePhonePeRefund(order.id.toString(), order.transactionId, orderAmount);
        if (refundResult.success) {
           order.refundTransactionId = refundResult.providerId;
        } else {
           console.error("PhonePe Refund Failed:", refundResult.message);
           return NextResponse.json({ success: false, message: 'Refund processing failed with payment gateway' }, { status: 500 });
        }
      } else {
        // COD order
        actualRefundMethod = 'None (COD)';
      }
    }

    // Update Order
    await order.update({
      refundMethod: actualRefundMethod,
      refundStatus: refundStatus
    });

    // Send Email asynchronously
    sendOrderCancelledEmail(user, order, 'admin', actualRefundMethod, finalTokensGranted).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Refund claimed successfully',
      data: order
    });

  } catch (error: any) {
    console.error("Claim Refund Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
