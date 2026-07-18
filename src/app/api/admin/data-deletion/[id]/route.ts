import { NextRequest, NextResponse } from 'next/server';
import { DataDeletionRequest } from '../../../../../models';
import { authenticateJWT, authorizeRoles } from '../../../../../middleware/auth';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
  if (authError) return authError;

  try {
    const body = await req.json();
    const { status } = body;

    const request = await DataDeletionRequest.findByPk(params.id);
    if (!request) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    if (status) {
      request.status = status;
      await request.save();
    }

    return NextResponse.json({ success: true, message: 'Request updated successfully', data: request });
  } catch (error: any) {
    console.error('Error updating request:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const userAuth = await authenticateJWT(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const authError = authorizeRoles(userAuth, 'Admin', 'SuperAdmin');
  if (authError) return authError;

  try {
    const request = await DataDeletionRequest.findByPk(params.id);
    if (!request) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    await request.destroy();

    return NextResponse.json({ success: true, message: 'Request deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting request:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
