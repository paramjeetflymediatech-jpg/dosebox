export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Category } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const showAll = req.nextUrl.searchParams.get('all') === 'true';
    const whereClause: any = showAll ? {} : { isActive: true };

    let categories = await Category.findAll({ 
      where: whereClause,
      order: [['name', 'ASC']] 
    });

    if (categories.length <= 1 && !showAll) {
      try {
        await Category.update({ isActive: true }, { where: { id: [1, 2, 3, 4, 5] } });
        categories = await Category.findAll({
          where: { isActive: true },
          order: [['name', 'ASC']]
        });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
