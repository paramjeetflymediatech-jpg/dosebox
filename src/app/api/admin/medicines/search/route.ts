import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import models from '../../../../../models';
import { authenticateJWT } from '../../../../../middleware/auth';

const { Medicine, Brand, Category } = models;

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;
    
    if (authResult.roleName !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const medicines = await Medicine.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { genericName: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 10
    });

    return NextResponse.json({ success: true, data: medicines }, { status: 200 });
  } catch (error: any) {
    console.error('Error searching medicines:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
