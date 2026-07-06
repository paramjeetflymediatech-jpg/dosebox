export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Medicine, UserActivity, Category } from '../../../../models';
import { authenticateJWT } from '../../../../middleware/auth';
import { Op, Sequelize } from 'sequelize';

export async function GET(req: NextRequest) {
  try {
    let userId: number | undefined = undefined;
    const authResult = await authenticateJWT(req);
    if (!(authResult instanceof NextResponse) && authResult.id) {
      userId = authResult.id;
    }

    const sessionId = req.cookies.get('dosebox_session')?.value;

    if (!userId && !sessionId) {
      // No tracking info, return random popular medicines
      const fallbackMedicines = await Medicine.findAll({
        where: { stock: { [Op.gt]: 0 } },
        limit: 4,
        order: [['discountPrice', 'DESC']]
      });
      return NextResponse.json({ success: true, data: fallbackMedicines });
    }

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else {
      whereClause.sessionId = sessionId;
    }
    
    whereClause.action = 'page_view';
    whereClause.path = { [Op.like]: '/medicines?category=%' };

    // 1. Fetch recent category views from UserActivity
    const recentActivities = await UserActivity.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const categorySlugs = new Set<string>();
    
    for (const activity of recentActivities) {
      const match = activity.path.match(/category=([^&]+)/);
      if (match && match[1]) {
        categorySlugs.add(match[1]);
      }
    }

    if (categorySlugs.size === 0) {
      // Fallback if no specific categories were visited
      const fallbackMedicines = await Medicine.findAll({
        where: { stock: { [Op.gt]: 0 } },
        limit: 4,
        order: [['price', 'DESC']]
      });
      return NextResponse.json({ success: true, data: fallbackMedicines });
    }

    // 2. Resolve category slugs to category IDs
    const categories = await Category.findAll({
      where: { slug: { [Op.in]: Array.from(categorySlugs) } }
    });

    const categoryIds = categories.map(c => c.id);

    // 3. Fetch up to 4 medicines matching these categories
    let recommendedMedicines = await Medicine.findAll({
      where: {
        categoryId: { [Op.in]: categoryIds },
        stock: { [Op.gt]: 0 }
      },
      limit: 4,
      order: [Sequelize.fn('RAND')] // Randomize slightly so they aren't always the exact same
    });

    // 4. Fill with fallbacks if we didn't find enough
    if (recommendedMedicines.length < 4) {
      const remaining = 4 - recommendedMedicines.length;
      const excludeIds = recommendedMedicines.map(m => m.id);
      
      const fillins = await Medicine.findAll({
        where: {
          id: { [Op.notIn]: excludeIds.length ? excludeIds : [0] },
          stock: { [Op.gt]: 0 }
        },
        limit: remaining,
        order: [['price', 'DESC']]
      });
      
      recommendedMedicines = [...recommendedMedicines, ...fillins];
    }

    return NextResponse.json({ success: true, data: recommendedMedicines });

  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
