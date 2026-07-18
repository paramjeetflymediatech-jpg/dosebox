export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { DataDeletionRequest, User } from '../../../../models';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';

export async function GET(req: NextRequest) {
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
  if (authError) return authError;

  try {
    const requests = await DataDeletionRequest.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('Error fetching data deletion requests:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
