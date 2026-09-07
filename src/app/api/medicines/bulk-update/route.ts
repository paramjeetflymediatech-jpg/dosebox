import { NextRequest, NextResponse } from 'next/server';
import { Medicine } from '../../../../models';
import redisClient from '../../../../config/redis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or missing ids array' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid or missing updates object' }, { status: 400 });
    }

    // Update medicines
    await Medicine.update(updates, {
      where: {
        id: ids
      }
    });

    // Clear caches
    if (redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('medicines:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (cacheErr) {
        console.warn('[Redis Cache Clear Failed]', cacheErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Bulk update successful' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
