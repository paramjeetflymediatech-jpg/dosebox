import { NextRequest, NextResponse } from 'next/server';
import { Blog } from '../../../../models';

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
    const blog = await Blog.create({
      ...body,
      authorId: 1 // default Admin
    });
    return NextResponse.json({ success: true, message: 'Article created', data: blog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
