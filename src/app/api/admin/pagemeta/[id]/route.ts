import { NextRequest, NextResponse } from 'next/server';
import { PageMeta } from '../../../../../models';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pageMeta = await PageMeta.findByPk(id);
    if (!pageMeta) {
      return NextResponse.json({ success: false, message: 'Page meta not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pageMeta }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const pageMeta = await PageMeta.findByPk(id);
    if (!pageMeta) {
      return NextResponse.json({ success: false, message: 'Page meta not found' }, { status: 404 });
    }
    await pageMeta.update(body);
    return NextResponse.json({ success: true, message: 'Page meta updated', data: pageMeta }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pageMeta = await PageMeta.findByPk(id);
    if (!pageMeta) {
      return NextResponse.json({ success: false, message: 'Page meta not found' }, { status: 404 });
    }
    await pageMeta.destroy();
    return NextResponse.json({ success: true, message: 'Page meta deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
