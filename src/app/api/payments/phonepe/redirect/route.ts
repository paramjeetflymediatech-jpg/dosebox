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
  const client = req.nextUrl.searchParams.get('client') || 'web';

  // For the actual URL the browser navigates to, Android's intent scheme is highly reliable
  const baseRedirect = client === 'mobile' ? 'dosebox://checkout' : `${baseUrl}/checkout`;

  const returnHtml = (status: 'success' | 'failed') => {
    if (client !== 'mobile') {
      return NextResponse.redirect(`${baseRedirect}?status=${status}`);
    }

    const isSuccess = status === 'success';
    // Use Android Intent URL for robust deep linking
    const intentUrl = `intent://checkout?status=${status}#Intent;scheme=dosebox;package=com.doseboxmobile;end`;
    const successGradient = 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 100%)';
    const failedGradient = 'linear-gradient(135deg, #fef2f2 0%, #f8fafc 100%)';

    const successIcon = `<svg class="icon-svg success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#10B981" fill-opacity="0.2"/>
      <circle cx="12" cy="12" r="9" fill="#10B981"/>
      <path d="M7.5 12L10.5 15L16.5 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const failedIcon = `<svg class="icon-svg failed" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#EF4444" fill-opacity="0.2"/>
      <circle cx="12" cy="12" r="9" fill="#EF4444"/>
      <path d="M9 9L15 15M15 9L9 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment ${isSuccess ? 'Successful' : 'Failed'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --success-color: #10B981;
            --success-dark: #059669;
            --failed-color: #EF4444;
            --failed-dark: #DC2626;
            --text-main: #0F172A;
            --text-muted: #64748B;
          }
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            background: ${isSuccess ? successGradient : failedGradient}; 
            text-align: center; 
            padding: 20px; 
            box-sizing: border-box;
          }
          .card { 
            background: rgba(255, 255, 255, 0.95); 
            padding: 48px 32px; 
            border-radius: 28px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02); 
            max-width: 420px; 
            width: 100%; 
            box-sizing: border-box; 
            backdrop-filter: blur(10px);
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .icon-wrapper {
            margin-bottom: 24px;
            animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
          }
          .icon-svg {
            width: 80px;
            height: 80px;
          }
          h1 { 
            margin: 0 0 12px; 
            color: var(--text-main); 
            font-size: 26px; 
            font-weight: 700; 
            letter-spacing: -0.02em;
          }
          p { 
            color: var(--text-muted); 
            margin: 0 0 36px; 
            line-height: 1.6; 
            font-size: 16px;
          }
          .btn { 
            display: inline-flex; 
            align-items: center;
            justify-content: center;
            background: ${isSuccess ? 'var(--success-color)' : 'var(--failed-color)'}; 
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 999px; 
            font-weight: 600; 
            font-size: 16px; 
            transition: all 0.2s ease; 
            width: 100%; 
            box-sizing: border-box;
            box-shadow: 0 4px 12px ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
          }
          .btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 16px ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
            background: ${isSuccess ? 'var(--success-dark)' : 'var(--failed-dark)'};
          }
          .btn:active { 
            transform: translateY(0);
          }
          .redirect-text {
            margin-top: 24px;
            font-size: 14px;
            color: #94A3B8;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid #E2E8F0;
            border-top-color: #94A3B8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.8); }
            70% { transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-wrapper">
            ${isSuccess ? successIcon : failedIcon}
          </div>
          <h1>Payment ${isSuccess ? 'Successful' : 'Failed'}</h1>
          <p>${isSuccess ? 'Your order has been placed securely.' : 'Something went wrong with your payment.'}</p>
          <a href="${intentUrl}" class="btn">Return to DoseBox App</a>
          <div class="redirect-text">
            <div class="spinner"></div>
            Redirecting automatically...
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = "${intentUrl}";
          }, 3000);
        </script>
      </body>
      </html>
    `;
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  };

  if (!orderId) {
    console.error('No orderId in redirect URL');
    return returnHtml('failed');
  }

  try {
    // Fetch the order to get the merchant transaction ID stored during initiation
    const order = await Order.findByPk(orderId);

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return returnHtml('failed');
    }

    // If already marked Paid (webhook arrived first), just redirect to success
    if (order.paymentStatus === 'Paid') {
      console.log(`Order ${orderId} already marked Paid — redirecting to success`);
      return returnHtml('success');
    }

    // Verify payment status server-side using the PhonePe SDK
    // order.transactionId holds the merchantOrderId set during initiation
    const merchantOrderId = order.transactionId;

    if (!merchantOrderId) {
      console.error(`No transactionId (merchantOrderId) on order ${orderId}`);
      return returnHtml('failed');
    }

    if (!phonePeClient) {
      console.error('PhonePe client not initialized');
      return returnHtml('failed');
    }

    console.log(`Verifying payment status for merchantOrderId: ${merchantOrderId}`);
    const statusResponse = await phonePeClient.getOrderStatus(merchantOrderId);
    console.log('PhonePe order status response:', JSON.stringify(statusResponse));

    const statusResponseAny = statusResponse as any;
    const paymentSuccess =
      statusResponseAny?.success === true ||
      statusResponseAny?.code === 'PAYMENT_SUCCESS' ||
      statusResponseAny?.state === 'COMPLETED' ||
      statusResponseAny?.state === 'SUCCESS' ||
      statusResponseAny?.data?.state === 'COMPLETED' ||
      statusResponseAny?.data?.state === 'SUCCESS' ||
      statusResponseAny?.paymentDetails?.[0]?.state === 'COMPLETED';

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
      return returnHtml('success');
    } else {
      // Only mark failed if still pending — don't override a webhook-set status
      if (order.paymentStatus === 'Pending') {
        await order.update({
          paymentStatus: 'Failed',
          status: 'Cancelled',
        });
        console.log(`Order ${orderId} marked as Failed after status check`);
      }
      return returnHtml('failed');
    }
  } catch (error: any) {
    console.error('PhonePe redirect handler error:', error);
    return returnHtml('failed');
  }
}
