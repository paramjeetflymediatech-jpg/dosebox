export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Blog, User } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const blogs = await Blog.findAll({ order: [['createdAt', 'DESC']] });
    return NextResponse.json({ success: true, data: blogs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Find a valid user ID to use as author
    const fallbackUser = await User.findOne();
    const validAuthorId = fallbackUser?.id || 1;

    const blog = await Blog.create({
      ...body,
      authorId: validAuthorId
    });
    return NextResponse.json({ success: true, message: 'Article created', data: blog }, { status: 201 });
  } catch (error: any) {
    console.error('Blog creation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
