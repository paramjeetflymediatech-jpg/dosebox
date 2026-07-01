import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Order } from '../../../../../models';

const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const rawSecret = PHONEPE_CLIENT_SECRET;
const ACTUAL_CLIENT_SECRET = (!rawSecret.includes('-') && rawSecret.length > 20) ? Buffer.from(rawSecret, 'base64').toString('utf-8') : rawSecret;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { response: base64Response } = body;
    const signature = req.headers.get('x-verify');

    if (!base64Response || !signature) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const stringToSign = base64Response + ACTUAL_CLIENT_SECRET;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const expectedSignature = sha256 + '###' + PHONEPE_SALT_INDEX;

    if (signature !== expectedSignature) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    const decodedResponse = Buffer.from(base64Response, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedResponse);

    const { merchantTransactionId, code, transactionId } = payload.data;

    const order = await Order.findOne({ where: { transactionId: merchantTransactionId } });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (code === 'PAYMENT_SUCCESS') {
      const timeline = JSON.parse(order.trackingTimeline || '[]');
      timeline.push({
        status: 'Payment Received',
        time: new Date().toISOString(),
        desc: `Payment successful. Ref: ${transactionId}`
      });

      await order.update({
        paymentStatus: 'Paid',
        trackingTimeline: JSON.stringify(timeline)
      });
    } else {
      await order.update({
        paymentStatus: 'Failed'
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
