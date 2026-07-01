import { NextRequest, NextResponse } from 'next/server';
import sequelize from '../../../../config/database';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');

    // Secure the route using an environment variable
    if (secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Invalid sync secret.' }, { status: 401 });
    }
    
    await sequelize.sync({ alter: true });
    
    return NextResponse.json({ success: true, message: 'Database successfully synced to match models!' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
