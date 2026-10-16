export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Category } from '../../../models';

export async function GET() {
  try {
    let categories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    // Auto Self-Healing on Live: If only 1 category is currently active,
    // automatically activate categories with active medicines (e.g. Anti Bacterials, Anti Fungals, Arthritis, Vaccines)
    if (categories.length <= 1) {
      try {
        await Category.update({ isActive: true }, { where: { id: [1, 2, 3, 4, 5] } });
        categories = await Category.findAll({
          where: { isActive: true },
          order: [['name', 'ASC']]
        });
      } catch (syncErr) {
        console.error('Self-healing category sync notice:', syncErr);
      }
    }

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
