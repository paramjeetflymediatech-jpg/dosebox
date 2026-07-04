export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Category } from '../../../models';

export async function GET() {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
