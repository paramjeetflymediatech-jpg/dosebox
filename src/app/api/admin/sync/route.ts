import { NextRequest, NextResponse } from 'next/server';
import sequelize from '../../../../config/database';

export async function GET(req: NextRequest) {
  try {
    // DO NOT expose this openly in a real production app without auth.
    // For this debug phase, we allow it so the admin can trigger it easily.
    
    await sequelize.sync({ alter: true });
    
    return NextResponse.json({ success: true, message: 'Database successfully synced to match models!' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
