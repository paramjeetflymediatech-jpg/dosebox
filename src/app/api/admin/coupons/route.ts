import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    return NextResponse.json({ success: true, data: coupons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coupon = await Coupon.create(body);
    return NextResponse.json({ success: true, message: 'Coupon added', data: coupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
