export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../../middleware/auth';
import { Order, User } from '../../../../../models';
import * as xlsx from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    // Only Leadership and SuperAdmin can download reports
    const roleAuth = authorizeRoles(userAuth, 'SuperAdmin', 'Leadership', 'Admin');
    if (roleAuth) return roleAuth;

    const orders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']]
    });

    const exportData = orders.map((order: any) => ({
      'Order ID': order.id,
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer Name': order.user?.name || 'Guest',
      'Customer Phone': order.user?.phone || 'N/A',
      'Total Amount': order.finalAmount,
      'Payment Status': order.paymentStatus,
      'Order Status': order.status,
      'Delivery Address': order.shippingAddress ? JSON.parse(order.shippingAddress).street : 'N/A'
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Generate buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="dosebox_orders_report.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
