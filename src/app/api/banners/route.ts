export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Banner } from '../../../models';

export async function GET(req: NextRequest) {
  try {
    const banners = await Banner.findAll({ 
      where: { active: true },
      order: [['createdAt', 'DESC']] 
    });
    return NextResponse.json({ success: true, data: banners }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
