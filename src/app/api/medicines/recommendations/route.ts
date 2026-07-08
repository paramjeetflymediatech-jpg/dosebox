export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Medicine, UserActivity, Category, Order, OrderItem } from '../../../../models';
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

    const purchasedBrandIds = new Set<number>();
    if (userId) {
      try {
        const userOrders = await Order.findAll({
          where: { userId },
          include: [{
            model: OrderItem,
            as: 'items',
            include: [{
              model: Medicine,
              as: 'medicine',
              attributes: ['brandId']
            }]
          }],
          order: [['createdAt', 'DESC']],
          limit: 5
        });

        for (const order of userOrders) {
          for (const item of (order as any).items || []) {
            if (item.medicine && item.medicine.brandId) {
              purchasedBrandIds.add(item.medicine.brandId);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user orders for recommendations:', err);
      }
    }

    if (categorySlugs.size === 0 && searchTerms.size === 0 && purchasedBrandIds.size === 0) {
      // No specific categories, searches, or past orders were found, do not return fallback medicines
      return NextResponse.json({ success: true, data: [] });
    }

    let recommendedMedicines: any[] = [];
    let excludedIds: number[] = [];

    // 2. Prioritize user's previously purchased brands
    if (purchasedBrandIds.size > 0) {
      const brandMedicines = await Medicine.findAll({
        where: {
          stock: { [Op.gt]: 0 },
          brandId: { [Op.in]: Array.from(purchasedBrandIds) }
        },
        limit: 4,
        order: [Sequelize.fn('RAND')]
      });
      recommendedMedicines.push(...brandMedicines);
      excludedIds = brandMedicines.map((m: any) => m.id);
    }

    // 3. If we still need more medicines (less than 4), fetch from categories and searches
    if (recommendedMedicines.length < 4 && (categorySlugs.size > 0 || searchTerms.size > 0)) {
      // Resolve category slugs to category IDs
      const categories = await Category.findAll({
        where: { slug: { [Op.in]: Array.from(categorySlugs) } }
      });

      const categoryIds = categories.map((c: any) => c.id);

      // Build query for medicines matching categories OR search terms
      const medicineWhereClause: any = {
        stock: { [Op.gt]: 0 }
      };

      if (excludedIds.length > 0) {
        medicineWhereClause.id = { [Op.notIn]: excludedIds };
      }

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
        
        const fallbackMedicines = await Medicine.findAll({
          where: medicineWhereClause,
          limit: 4 - recommendedMedicines.length,
          order: [Sequelize.fn('RAND')]
        });
        
        recommendedMedicines.push(...fallbackMedicines);
      }
    }

    return NextResponse.json({ success: true, data: recommendedMedicines });

  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
