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
    const { refundMethod, cancelReason } = body; // refundMethod: 'bank' | 'tokens'

    const order = await Order.findByPk(orderId);
    if (!order || order.userId !== userAuth.id) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'Cancelled') {
      return NextResponse.json({ success: false, message: 'Order is already cancelled' }, { status: 400 });
    }

    // Status Gate
    const uncancelableStatuses = ['Shipped', 'Out For Delivery', 'Delivered'];
    if (uncancelableStatuses.includes(order.status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order has already been shipped and cannot be cancelled.' 
      }, { status: 403 });
    }

    const user = await User.findByPk(userAuth.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let finalTokensGranted = 0;
    let actualRefundMethod = refundMethod;
    let refundStatus = 'None';

    const orderAmount = Number(order.finalAmount);
    const bonusTokens = orderAmount < 500 ? 50 : 100;
    const tokensToRefund = order.tokensUsed || 0;

    if (refundMethod === 'tokens') {
      // Check limit
      const currentTokenRefunds = user.tokenRefundCount || 0;
      let actualBonus = bonusTokens;
      
      if (currentTokenRefunds >= 2) {
        // Limit reached: allow cancellation but strip bonus tokens
        actualBonus = 0;
      } else {
        // Increment count only if they actually got a bonus
        await user.update({ tokenRefundCount: currentTokenRefunds + 1 });
      }

      // For COD, they haven't paid, so they only get the bonus tokens + any tokens they used
      const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
      finalTokensGranted = isCOD ? actualBonus + tokensToRefund : orderAmount + actualBonus + tokensToRefund;
      
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
        bonusTokens: actualBonus,
        description: `Refund for Cancelled Order #${order.id} (Customer Fault)`
      });

      refundStatus = 'Processed';
    } else if (refundMethod === 'bank') {
      // Trigger Bank Refund via PhonePe if payment was online
      if (order.paymentMethod === 'PhonePe' && order.transactionId && order.paymentStatus === 'Paid') {
        refundStatus = 'Pending';
        // We will call the phonepe refund internally
        const refundResult = await initiatePhonePeRefund(order.id.toString(), order.transactionId, orderAmount);
        if (refundResult.success) {
           order.refundTransactionId = refundResult.providerId;
        } else {
           console.error("PhonePe Refund Failed:", refundResult.message);
        }
      } else {
        // COD order
        actualRefundMethod = 'None (COD)';
      }
      
      // Refund tokens if any were used
      if (tokensToRefund > 0) {
        await user.update({ doseboxTokens: (user.doseboxTokens || 0) + tokensToRefund });
        await DoseboxTokenTransaction.create({
          userId: user.id,
          orderId: order.id,
          type: 'Refund',
          tokens: tokensToRefund,
          bonusTokens: 0,
          description: `Refunded tokens used for Cancelled Order #${order.id}`
        });
      }
    }

    // Update Order
    await order.update({
      status: 'Cancelled',
      cancelledBy: 'customer',
      cancelReason: cancelReason || 'Cancelled by customer',
      refundMethod: actualRefundMethod,
      refundStatus: refundStatus
    });

    // Send Email asynchronously
    sendOrderCancelledEmail(user, order, 'customer', actualRefundMethod, finalTokensGranted).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error: any) {
    console.error("Cancel Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
