export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Blog } from '../../../../models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Support fetching by ID or by Slug (as the admin route does)
    let blog = null;
    if (!isNaN(Number(id))) {
      blog = await Blog.findByPk(id);
    }
    
    if (!blog) {
      blog = await Blog.findOne({ where: { slug: id } });
    }
    
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: blog }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching blog details:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
