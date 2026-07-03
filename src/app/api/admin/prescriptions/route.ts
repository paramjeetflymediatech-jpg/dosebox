import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Prescription, ExtractedMedicine, MatchedProduct, Medicine, User } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const authCheck = authorizeRoles(userAuth, 'Admin', 'Pharmacist');
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const prescriptions = await Prescription.findAll({
      where: filter,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: ExtractedMedicine,
          as: 'extractedMedicines',
          include: [
            {
              model: MatchedProduct,
              as: 'matchedProduct',
              include: [{ model: Medicine, as: 'product' }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: prescriptions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const authCheck = authorizeRoles(userAuth, 'Admin', 'Pharmacist');
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await req.json();
    const { id, status, pharmacistNotes } = body;

    const prescription = await Prescription.findByPk(id);
    if (!prescription) {
      return NextResponse.json({ success: false, message: 'Prescription not found' }, { status: 404 });
    }

    await prescription.update({
      status: status || prescription.status,
      pharmacistNotes: pharmacistNotes !== undefined ? pharmacistNotes : prescription.pharmacistNotes
    });

    return NextResponse.json({ success: true, message: 'Prescription updated', data: prescription }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
