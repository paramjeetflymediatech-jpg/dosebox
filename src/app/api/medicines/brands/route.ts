import { NextRequest, NextResponse } from 'next/server';
import { Brand } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const brands = await Brand.findAll({ order: [['name', 'ASC']] });
    return NextResponse.json({ success: true, data: brands }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
