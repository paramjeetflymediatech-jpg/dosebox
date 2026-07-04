export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Doctor } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const doctors = await Doctor.findAll();
    return NextResponse.json({ success: true, data: doctors }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
