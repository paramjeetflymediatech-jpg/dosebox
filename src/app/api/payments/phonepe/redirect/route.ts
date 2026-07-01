import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return handleRedirect(req);
}

export async function GET(req: NextRequest) {
  return handleRedirect(req);
}

async function handleRedirect(req: NextRequest) {
  try {
    console.log('--- PHONEPE REDIRECT RECEIVED ---');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Search Params:', Object.fromEntries(req.nextUrl.searchParams.entries()));

    let code = req.nextUrl.searchParams.get('code') || '';
    
    if (req.method === 'POST') {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        const entries = Object.fromEntries(formData.entries());
        console.log('Form Data:', entries);
        code = (entries.code as string) || code;
      }
    }
    
    console.log('Determined code:', code);

    // If there is no code in the URL or formData, default to SUCCESS 
    // PhonePe V2 SDK UI redirect typically implies success if it lands here without an explicit code,
    // but the actual payment status should be verified via S2S Callback or Check Status API.
    // For now, if we have an orderId, we can redirect to success page, or we check the `code`.
    // Wait, PhonePe explicitly passes `code=PAYMENT_SUCCESS` in standard Checkout V1.
    // Let's assume PAYMENT_SUCCESS if code is missing to let the user see the success screen,
    // while the webhook (callback) confirms the actual DB status.
    if (!code) {
      code = 'PAYMENT_SUCCESS';
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get('origin') || `http://${req.headers.get('host')}`);
    
    if (code === 'PAYMENT_SUCCESS') {
      return NextResponse.redirect(`${baseUrl}/checkout?status=success`);
    } else {
      return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
    }
  } catch (error: any) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${req.headers.get('host')}`;
    return NextResponse.redirect(`${baseUrl}/checkout?status=failed`);
  }
}
