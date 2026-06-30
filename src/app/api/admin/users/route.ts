import { NextRequest, NextResponse } from 'next/server';
import { User } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'roleId', 'status', 'createdAt']
    });
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
