import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../middleware/auth';
import { saveUploadFile } from '../../../middleware/upload';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Please upload a file' }, { status: 400 });
    }

    const fileUrl = await saveUploadFile(file);

    return NextResponse.json({ success: true, fileUrl, message: 'File uploaded successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
