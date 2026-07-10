import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Order } from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT86';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076';
const PHONEPE_SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
const PHONEPE_ENV = process.env.PHONEPE_ENV === 'production' ? 'production' : 'sandbox';

const PHONEPE_API_URL = PHONEPE_ENV === 'production' 
  ? 'https://api.phonepe.com/apis/hermes' 
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

/**
 * Initiates a refund directly with PhonePe via their API.
 */
export async function initiatePhonePeRefund(orderId: string, originalTransactionId: string, amount: number) {
  try {
    const refundTransactionId = 'RF-' + orderId + '-' + Date.now();
    const amountInPaise = Math.round(amount * 100);

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantUserId: 'USER-' + orderId, // Dummy user ID for payload format
      originalTransactionId: originalTransactionId,
      merchantTransactionId: refundTransactionId,
      amount: amountInPaise,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/phonepe/callback`,
    };

    const payloadString = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadString).toString('base64');

    const stringToHash = base64Payload + '/pg/v1/refund' + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + '###' + PHONEPE_SALT_INDEX;

    const response = await fetch(`${PHONEPE_API_URL}/pg/v1/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const responseData = await response.json();

    if (responseData.success) {
      return { success: true, providerId: responseData.data?.transactionId || refundTransactionId };
    } else {
      return { success: false, message: responseData.message || 'Refund API failed' };
    }

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Route handler for manual admin refunds
 */
export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    // Optional: add authorizeRoles check here for Admin only

    const body = await req.json();
    const { orderId } = body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.paymentMethod !== 'PhonePe' || !order.transactionId) {
      return NextResponse.json({ success: false, message: 'Order was not paid online via PhonePe' }, { status: 400 });
    }

    const refundAmount = Number(order.finalAmount);
    const refundResult = await initiatePhonePeRefund(order.id.toString(), order.transactionId, refundAmount);

    if (refundResult.success) {
      await order.update({
        refundStatus: 'Processed',
        refundTransactionId: refundResult.providerId
      });
      return NextResponse.json({ success: true, message: 'Refund initiated successfully', data: refundResult });
    } else {
      return NextResponse.json({ success: false, message: refundResult.message }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Manual Refund Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
