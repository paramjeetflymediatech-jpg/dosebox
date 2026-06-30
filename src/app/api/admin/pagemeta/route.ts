import { NextRequest, NextResponse } from 'next/server';
import { PageMeta } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const pageMeta = await PageMeta.findAll();
    return NextResponse.json({ success: true, data: pageMeta }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pageMeta = await PageMeta.create(body);
    return NextResponse.json({ success: true, message: 'Page meta added', data: pageMeta }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
