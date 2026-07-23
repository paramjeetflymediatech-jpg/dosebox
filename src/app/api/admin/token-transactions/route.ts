export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { DoseboxTokenTransaction, User } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership');
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;

    const transactions = await DoseboxTokenTransaction.findAll({
      where: filter,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
