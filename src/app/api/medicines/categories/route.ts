import { NextRequest, NextResponse } from 'next/server';
import { Category } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
