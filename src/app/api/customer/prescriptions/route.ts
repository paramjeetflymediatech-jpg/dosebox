import { NextRequest, NextResponse } from 'next/server';
import models from '../../../../models';
import { authenticateJWT } from '../../../../middleware/auth';

const { Prescription, DraftCart, DraftCartItem, Medicine } = models;

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateJWT(req);
    if (authResult instanceof NextResponse) return authResult;

    const prescriptions = await Prescription.findAll({
      where: { userId: authResult.id },
      include: [
        {
          model: DraftCart,
          as: 'draftCart',
          include: [
            {
              model: DraftCartItem,
              as: 'items',
              include: [{ model: Medicine, as: 'medicine' }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: prescriptions }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching customer prescriptions:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
