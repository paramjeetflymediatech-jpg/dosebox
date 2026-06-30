import { NextRequest, NextResponse } from 'next/server';
import { Banner } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const banners = await Banner.findAll({ order: [['createdAt', 'DESC']] });
    return NextResponse.json({ success: true, data: banners }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const banner = await Banner.create(body);
    return NextResponse.json({ success: true, message: 'Banner added', data: banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

