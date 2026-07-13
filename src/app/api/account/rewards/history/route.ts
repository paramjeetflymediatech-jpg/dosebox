export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { DoseboxTokenTransaction, User } from '../../../../../models';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateJWT(req);
    if (auth instanceof NextResponse) return auth;

    const user = await User.findByPk(auth.id, { attributes: ['doseboxTokens'] });

    const { Op } = require('sequelize');
    
    const transactions = await DoseboxTokenTransaction.findAll({
      where: { 
        userId: auth.id,
        tokens: { [Op.ne]: 0 }
      },
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ 
      success: true, 
      data: transactions,
      currentTokens: user?.doseboxTokens || 0
    });
  } catch (error: any) {
    console.error('Error fetching reward history:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
