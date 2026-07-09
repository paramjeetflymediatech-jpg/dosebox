export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { StandardCheckoutClient, Env } from '@phonepe-pg/pg-sdk-node';
import { Order } from '../../../../../models';

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
  console.error('PhonePe SDK Init Error (redirect):', error);
}

export async function POST(req: NextRequest) {
  return handleRedirect(req);
}

export async function GET(req: NextRequest) {
  return handleRedirect(req);
}

async function handleRedirect(req: NextRequest) {
  console.log('--- PHONEPE REDIRECT RECEIVED ---');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Search Params:', Object.fromEntries(req.nextUrl.searchParams.entries()));

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get('origin') ||
    `http://${req.headers.get('host')}`;

  const orderId = req.nextUrl.searchParams.get('orderId');

  if (!orderId) {
    console.error('No orderId in redirect URL');
    return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
  }

  try {
    // Fetch the order to get the merchant transaction ID stored during initiation
    const order = await Order.findByPk(orderId);

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
    }

    // If already marked Paid (webhook arrived first), just redirect to success
    if (order.paymentStatus === 'Paid') {
      console.log(`Order ${orderId} already marked Paid — redirecting to success`);
      return NextResponse.redirect(`${baseUrl}/checkout?status=success`);
    }

    // Verify payment status server-side using the PhonePe SDK
    // order.transactionId holds the merchantOrderId set during initiation
    const merchantOrderId = order.transactionId;

    if (!merchantOrderId) {
      console.error(`No transactionId (merchantOrderId) on order ${orderId}`);
      return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
    }

    if (!phonePeClient) {
      console.error('PhonePe client not initialized');
      return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
    }

    console.log(`Verifying payment status for merchantOrderId: ${merchantOrderId}`);
    const statusResponse = await phonePeClient.getOrderStatus(merchantOrderId);
    console.log('PhonePe order status response:', JSON.stringify(statusResponse));

    const paymentSuccess =
      statusResponse?.state === 'COMPLETED' ||
      statusResponse?.paymentDetails?.[0]?.state === 'COMPLETED';

    if (paymentSuccess) {
      if (order.paymentStatus !== 'Paid') {
        const timeline = JSON.parse((order as any).trackingTimeline || '[]');
        timeline.push({
          status: 'Payment Received',
          time: new Date().toISOString(),
          desc: `Payment verified via redirect. Ref: ${merchantOrderId}`,
        });
        await order.update({
          paymentStatus: 'Paid',
          trackingTimeline: JSON.stringify(timeline),
        });
        console.log(`Order ${orderId} marked as Paid via redirect verification`);
      }
      return NextResponse.redirect(`${baseUrl}/checkout?status=success`);
    } else {
      // Only mark failed if still pending — don't override a webhook-set status
      if (order.paymentStatus === 'Pending') {
        await order.update({
          paymentStatus: 'Failed',
          status: 'Cancelled',
        });
        console.log(`Order ${orderId} marked as Failed after status check`);
      }
      return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
    }
  } catch (error: any) {
    console.error('PhonePe redirect handler error:', error);
    return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
  }
}
