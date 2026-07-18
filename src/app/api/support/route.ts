export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SupportTicket } from '../../../models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, issueType, orderId, message, userId } = body;

    if (!name || !email || !phone || !issueType || !message) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const ticket = await SupportTicket.create({
      name,
      email,
      phone,
      issueType,
      orderId: orderId || null,
      message,
      status: 'Open',
      userId: userId || null
    });

    return NextResponse.json({ success: true, message: 'Support ticket submitted successfully', data: ticket }, { status: 201 });
  } catch (error: any) {
    console.error('Support Ticket Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
