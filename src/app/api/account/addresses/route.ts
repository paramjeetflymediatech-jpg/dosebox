import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { Address } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const addresses = await Address.findAll({
      where: { userId: userAuth.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    return NextResponse.json({ success: true, data: addresses }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch addresses', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const body = await req.json();
    const { title, street, city, state, zipCode, country, isDefault } = body;

    if (!title || !street || !city || !state || !zipCode) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: userAuth.id } });
    }

    const newAddress = await Address.create({
      userId: userAuth.id,
      title,
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      isDefault: isDefault || false
    });

    return NextResponse.json({ success: true, message: 'Address added', data: newAddress }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to add address', error: error.message }, { status: 500 });
  }
}
