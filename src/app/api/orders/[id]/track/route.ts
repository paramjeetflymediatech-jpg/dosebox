export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Order } from '../../../../../models';
import { getLogisticsProvider } from '../../../../../lib/logistics';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const order = await Order.findByPk(params.id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Verify ownership or staff access
    const isStaff = ['Admin', 'SuperAdmin', 'Pharmacist', 'Leadership', 'Medico', 'Doctor'].some(r => r.toLowerCase() === userAuth.roleName?.trim().toLowerCase());
    if (Number(order.userId) !== Number(userAuth.id) && !isStaff) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (!order.trackingId) {
      return NextResponse.json({ 
        success: true, 
        message: 'No live tracking available yet.',
        data: null 
      });
    }

    // Fetch live tracking from Logistics Provider
    const logistics = getLogisticsProvider();
    const trackingData = await logistics.trackShipment(order.trackingId);

    if (!trackingData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tracking details unavailable from courier' 
      }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: trackingData });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
