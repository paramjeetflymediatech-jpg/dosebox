import { NextRequest, NextResponse } from 'next/server';
import { Setting } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const settings = await Setting.findAll();
    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const settingsToUpdate = body.settings; // array of { key, value }
    if (!Array.isArray(settingsToUpdate)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    for (const item of settingsToUpdate) {
      const { key, value } = item;
      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: { key, value }
      });
      if (!created) {
        setting.value = value;
        await setting.save();
      }
    }
    return NextResponse.json({ success: true, message: 'Settings updated' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

