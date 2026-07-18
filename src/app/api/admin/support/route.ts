export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SupportTicket } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const tickets = await SupportTicket.findAll({
      order: [['createdAt', 'DESC']]
    });
    return NextResponse.json({ success: true, data: tickets }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
