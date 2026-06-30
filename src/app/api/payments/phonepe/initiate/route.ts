import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Order } from '../../../../../models';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID || 'PGTESTPAYUAT';
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const userId = userAuth.id;
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    const order = await Order.findOne({ where: { id: orderId, userId } });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'Paid') {
      return NextResponse.json({ success: false, message: 'Order is already paid' }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(order.finalAmount) * 100);
    const merchantTransactionId = `MT-${order.id}-${Date.now()}`;
    
    const host = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/https?:\/\//, '') : (req.headers.get('host') || 'localhost:3000');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    let baseUrl = `${protocol}://${host}`;
    if (process.env.NEXT_PUBLIC_APP_URL) {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }

    const payloadData = {
      merchantId: PHONEPE_CLIENT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: `U${userId}`,
      amount: amountInPaise,
      redirectUrl: `${baseUrl}/api/payments/phonepe/redirect`,
      redirectMode: 'POST',
      callbackUrl: process.env.PHONEPE_CALLBACK_URL || `${baseUrl}/api/payments/phonepe/callback`,
      mobileNumber: '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const payloadString = JSON.stringify(payloadData);
    const base64EncodedPayload = Buffer.from(payloadString).toString('base64');
    
    const endpoint = process.env.PHONEPE_PAY_URL || '/pg/checkout/v2/pay';
    const stringToSign = base64EncodedPayload + endpoint + PHONEPE_CLIENT_SECRET;
    
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const checksum = sha256 + '###' + PHONEPE_SALT_INDEX;

    let requestUrl = process.env.PHONEPE_PAY_URL || endpoint;
    if (requestUrl.startsWith('/')) {
      const base = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis';
      requestUrl = `${base}${requestUrl}`;
    }

    const options = {
      method: 'POST',
      url: requestUrl,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      data: {
        request: base64EncodedPayload
      }
    };

    const response = await axios.request(options);

    if (response.data && response.data.success) {
      const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
      await order.update({ transactionId: merchantTransactionId });
      return NextResponse.json({ success: true, redirectUrl }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'PhonePe API error', error: response.data }, { status: 400 });
    }

  } catch (error: any) {
    console.error('PhonePe Initiate Error:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: 'Failed to initiate payment', error: error.response?.data || error.message }, { status: 500 });
  }
}
