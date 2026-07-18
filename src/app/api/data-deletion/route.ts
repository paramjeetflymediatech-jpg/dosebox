export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { DataDeletionRequest } from '../../../models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, reason, userId } = body;

    if (!email || !reason) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const request = await DataDeletionRequest.create({
      email,
      reason,
      status: 'Pending',
      userId: userId || null
    });

    return NextResponse.json({ success: true, message: 'Data deletion request submitted successfully', data: request }, { status: 201 });
  } catch (error: any) {
    console.error('Data Deletion Request Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
