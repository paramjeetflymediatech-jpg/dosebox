import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Address } from '../../../../../models';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const addressId = params.id;
    const body = await req.json();
    const { title, street, city, state, zipCode, country, isDefault } = body;

    const address = await Address.findOne({ where: { id: addressId, userId: userAuth.id } });
    if (!address) {
      return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    }

    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: userAuth.id } });
    }

    await address.update({
      title: title || address.title,
      street: street || address.street,
      city: city || address.city,
      state: state || address.state,
      zipCode: zipCode || address.zipCode,
      country: country || address.country,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault
    });

    return NextResponse.json({ success: true, message: 'Address updated', data: address }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update address', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const addressId = params.id;

    const address = await Address.findOne({ where: { id: addressId, userId: userAuth.id } });
    if (!address) {
      return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    }

    await address.destroy();

    return NextResponse.json({ success: true, message: 'Address deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to delete address', error: error.message }, { status: 500 });
  }
}
