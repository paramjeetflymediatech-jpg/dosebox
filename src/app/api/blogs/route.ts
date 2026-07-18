export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Blog } from '../../../models';

export async function GET(req: NextRequest) {
  try {
    const blogs = await Blog.findAll({
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, data: blogs });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
