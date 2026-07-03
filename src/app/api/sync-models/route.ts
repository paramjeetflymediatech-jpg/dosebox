export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import sequelize from '@/config/database';
import '@/models';

export async function GET() {
  try {
    await sequelize.sync({ alter: true });
    return NextResponse.json({ success: true, message: 'Database synced successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
