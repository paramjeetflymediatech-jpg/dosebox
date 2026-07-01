import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Order, OrderItem, Medicine, User } from '../../../../../models';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const order: any = await Order.findByPk(params.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] },
        { model: User, as: 'user' }
      ]
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Only allow Admin/Pharmacist or the order owner to view the invoice
    if (order.userId !== userAuth.id && userAuth.roleName !== 'Admin' && userAuth.roleName !== 'Pharmacist') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return new Promise<NextResponse>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const response = new NextResponse(pdfBuffer);
          response.headers.set('Content-Type', 'application/pdf');
          response.headers.set('Content-Disposition', `attachment; filename=Invoice_OD-${order.id}.pdf`);
          resolve(response);
        });

        // Generate PDF Content
        doc.fontSize(20).text('INVOICE', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Order ID: OD-${order.id}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.text(`Payment: ${order.paymentStatus}`);
        doc.moveDown();

        doc.fontSize(14).text('Customer Details:');
        doc.fontSize(12).text(`Name: ${order.user?.name || 'N/A'}`);
        doc.text(`Email: ${order.user?.email || 'N/A'}`);
        doc.text(`Phone: ${order.user?.phone || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(14).text('Items:');
        doc.moveDown(0.5);

        let subtotal = 0;
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            const itemName = item.medicine?.name || 'Item';
            const itemTotal = Number(item.price) * item.quantity;
            subtotal += itemTotal;
            doc.fontSize(12).text(`${itemName} x ${item.quantity} = Rs. ${itemTotal.toFixed(2)}`);
          });
        }

        doc.moveDown();
        doc.fontSize(14).text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { align: 'right' });
        doc.fontSize(12).text(`Discount: Rs. ${Number(order.discountAmount || 0).toFixed(2)}`, { align: 'right' });
        doc.fontSize(12).text(`GST: Rs. ${Number(order.gstAmount || 0).toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(16).text(`Final Amount: Rs. ${Number(order.finalAmount).toFixed(2)}`, { align: 'right' });

        doc.end();
      } catch (err) {
        console.error('PDF Generation Error:', err);
        reject(err);
      }
    });

  } catch (err: any) {
    console.error('Invoice Route Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
