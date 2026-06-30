import { NextRequest, NextResponse } from 'next/server';
import { Blog } from '../../../../../models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const blog = await Blog.findByPk(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: blog }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const blog = await Blog.findByPk(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    }
    await blog.update(body);
    return NextResponse.json({ success: true, message: 'Article updated', data: blog }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const blog = await Blog.findByPk(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    }
    await blog.destroy();
    return NextResponse.json({ success: true, message: 'Article deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
