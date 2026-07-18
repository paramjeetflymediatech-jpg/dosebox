import { NextResponse } from 'next/server';
import { Coupon } from '../../../../models';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, cartTotal } = body;

    if (!code) {
      return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), active: true } });

    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid or inactive promo code.' }, { status: 404 });
    }

    const now = new Date();
    if (new Date(coupon.expiryDate) < now) {
      return NextResponse.json({ success: false, message: 'This promo code has expired.' }, { status: 400 });
    }

    if (cartTotal && cartTotal < Number(coupon.minOrderValue)) {
      return NextResponse.json({ 
        success: false, 
        message: `Minimum order value for this promo code is ₹${coupon.minOrderValue}` 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: coupon }, { status: 200 });

  } catch (error: any) {
    console.error('Coupon verify error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
