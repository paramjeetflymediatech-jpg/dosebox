import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return handleRedirect(req);
}

export async function GET(req: NextRequest) {
  return handleRedirect(req);
}

async function handleRedirect(req: NextRequest) {
  try {
    let code = req.nextUrl.searchParams.get('code') || '';
    console.log('Redirect query params:', Object.fromEntries(req.nextUrl.searchParams));
    
    if (!code && req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('Redirect json body:', body);
        code = body.code || '';
      } catch {
        const formData = await req.formData().catch(() => null);
        if (formData) {
          const entries = Object.fromEntries(formData.entries());
          console.log('Redirect formData:', entries);
          code = (entries.code as string) || '';
        }
      }
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
