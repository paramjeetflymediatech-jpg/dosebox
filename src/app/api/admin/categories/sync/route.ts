export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Category, Medicine } from '../../../../../models';
import { detectCategoryId } from '@/lib/autoCategorize';

export async function POST(req: NextRequest) {
  try {
    // 1. Activate all valid categories with active medicines
    await Category.update({ isActive: true }, { where: { id: [1, 2, 3, 4, 5] } });

    // 2. Scan all medicines in database: if categoryId is missing, auto-assign based on salt/composition
    const medicines = await Medicine.findAll();
    let reclassifiedCount = 0;

    for (const med of medicines) {
      const correctCatId = detectCategoryId(med.name, med.composition, med.genericName);
      
      // If medicine has no category, or has category 1 but matches specific non-oncology (2, 3, 4, 5)
      if (!med.categoryId || (med.categoryId === 1 && correctCatId !== 1)) {
        await med.update({ categoryId: correctCatId });
        reclassifiedCount++;
      }
    }

    // 3. Return updated category stats
    const updatedCategories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    return NextResponse.json({
      success: true,
      message: `Categories synced successfully! 5 categories activated, ${reclassifiedCount} medicines mapped.`,
      data: {
        reclassifiedCount,
        categories: updatedCategories
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error during category sync:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
