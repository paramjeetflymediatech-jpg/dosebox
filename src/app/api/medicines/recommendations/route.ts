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
      // No tracking info, do not return random fallback medicines
      return NextResponse.json({ success: true, data: [] });
    }

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else {
      whereClause.sessionId = sessionId;
    }
    
    whereClause.action = 'page_view';
    whereClause.path = { [Op.like]: '/medicines?%' };

    // 1. Fetch recent category views and searches from UserActivity
    const recentActivities = await UserActivity.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const categorySlugs = new Set<string>();
    const searchTerms = new Set<string>();
    
    for (const activity of recentActivities) {
      const catMatch = activity.path.match(/category=([^&]+)/);
      if (catMatch && catMatch[1]) {
        categorySlugs.add(catMatch[1]);
      }
      const searchMatch = activity.path.match(/search=([^&]+)/);
      if (searchMatch && searchMatch[1]) {
        searchTerms.add(decodeURIComponent(searchMatch[1]));
      }
    }

    if (categorySlugs.size === 0 && searchTerms.size === 0) {
      // No specific categories or searches were visited, do not return fallback medicines
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Resolve category slugs to category IDs
    const categories = await Category.findAll({
      where: { slug: { [Op.in]: Array.from(categorySlugs) } }
    });

    const categoryIds = categories.map(c => c.id);

    // 3. Build query for medicines matching categories OR search terms
    const medicineWhereClause: any = {
      stock: { [Op.gt]: 0 }
    };

    const orConditions: any[] = [];
    if (categoryIds.length > 0) {
      orConditions.push({ categoryId: { [Op.in]: categoryIds } });
    }
    for (const term of searchTerms) {
      orConditions.push({ name: { [Op.like]: `%${term}%` } });
      orConditions.push({ genericName: { [Op.like]: `%${term}%` } }); // also check generic name
    }

    if (orConditions.length > 0) {
      medicineWhereClause[Op.or] = orConditions;
    }

    // 4. Fetch up to 4 medicines matching these criteria
    let recommendedMedicines = await Medicine.findAll({
      where: medicineWhereClause,
      limit: 4,
      order: [Sequelize.fn('RAND')] // Randomize slightly
    });

    return NextResponse.json({ success: true, data: recommendedMedicines });

  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
