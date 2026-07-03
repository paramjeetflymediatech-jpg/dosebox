import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { RewardTransaction } from '../../../../../models';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateJWT(req);
    if (auth instanceof NextResponse) return auth;

    const transactions = await RewardTransaction.findAll({
      where: { userId: auth.id },
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error('Error fetching reward history:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
