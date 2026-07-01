import { NextRequest, NextResponse } from 'next/server';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import { Order } from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID!;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET!;
const PHONEPE_SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
const PHONEPE_ENV = process.env.PHONEPE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;

let phonePeClient: StandardCheckoutClient | null = null;
try {
  phonePeClient = StandardCheckoutClient.getInstance(
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    PHONEPE_SALT_INDEX,
    PHONEPE_ENV
  );
} catch (error) {
  console.error("PhonePe SDK Init Error:", error);
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const userId = userAuth.id;

    if (!phonePeClient) {
      throw new Error("PhonePe SDK not initialized properly.");
    }

    const body = await req.json();
    const { orderId } = body;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'Paid') {
      return NextResponse.json({ success: false, message: 'Order is already paid' }, { status: 400 });
    }

    const merchantOrderId = 'MT-' + order.id.toString() + '-' + Date.now();
    const amountInPaise = Math.round(Number(order.finalAmount) * 100);

    const host = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/https?:\/\//, '') : (req.headers.get('host') || 'localhost:3000');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    let baseUrl = `${protocol}://${host}`;
    if (process.env.NEXT_PUBLIC_APP_URL) {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }

    const redirectUrl = new URL(
      `/api/payments/phonepe/redirect?orderId=${order.id}`,
      baseUrl
    ).toString();

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaise)
      .redirectUrl(redirectUrl)
      .build();

    const response = await phonePeClient.pay(payRequest);

    // Save transaction ID in order
    await order.update({ transactionId: merchantOrderId });

    // Ensure we return exactly what the frontend expects
    return NextResponse.json({ 
      success: true, 
      redirectUrl: response.redirectUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error('PhonePe Initiate Error:', error.message || error);
    if (error.response?.data) console.error(error.response.data);
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: error.message },
      { status: 500 }
    );
  }
}
