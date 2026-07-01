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
        // Setup document with standard A4 size
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const response = new NextResponse(pdfBuffer);
          response.headers.set('Content-Type', 'application/pdf');
          response.headers.set('Content-Disposition', `attachment; filename=Invoice_OD-${order.id}.pdf`);
          resolve(response);
        });

        // Brand colors
        const brandColor = '#059669'; // Emerald 600
        const darkGray = '#1e293b';
        const lightGray = '#94a3b8';
        const ultraLightGray = '#f1f5f9';

        // Helper to draw horizontal line
        const generateHr = (doc: PDFKit.PDFDocument, y: number) => {
          doc.strokeColor(ultraLightGray).lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
        };

        // --- Header Section ---
        const logoPath = require('path').join(process.cwd(), 'public', 'Media.jpg');
        try {
          doc.image(logoPath, 50, 50, { width: 160 });
        } catch (e) {
          console.error('Failed to load logo:', e);
        }

        // Invoice Details
        doc.fillColor(brandColor).font('Helvetica-Bold').fontSize(24).text('INVOICE', 50, 58, { align: 'right' });
        doc.fillColor(lightGray).font('Helvetica').fontSize(10).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 85, { align: 'right' });
        doc.fillColor(darkGray).font('Helvetica-Bold').text(`Invoice #: OD-${order.id}`, 50, 100, { align: 'right' });

        generateHr(doc, 130);

        // --- Customer & Order Info Section ---
        const customerTop = 150;
        doc.fillColor(darkGray).font('Helvetica-Bold').fontSize(12).text('Billed To:', 50, customerTop);
        doc.font('Helvetica').fontSize(10).fillColor(darkGray);
        doc.text(`Name: ${order.user?.name || 'Customer'}`, 50, customerTop + 20);
        doc.text(`Email: ${order.user?.email || 'N/A'}`, 50, customerTop + 35);
        doc.text(`Phone: ${order.user?.phone || 'N/A'}`, 50, customerTop + 50);

        doc.fillColor(darkGray).font('Helvetica-Bold').fontSize(12).text('Order Status:', 300, customerTop);
        doc.font('Helvetica').fontSize(10).fillColor(darkGray);
        doc.text(`Status: ${order.status}`, 300, customerTop + 20);
        doc.text(`Payment: ${order.paymentStatus}`, 300, customerTop + 35);
        doc.text(`Method: ${order.paymentMethod || 'N/A'}`, 300, customerTop + 50);

        generateHr(doc, 230);

        // --- Table Header ---
        const invoiceTableTop = 260;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(darkGray);
        doc.text('Item Description', 50, invoiceTableTop);
        doc.text('Unit Price', 280, invoiceTableTop, { width: 90, align: 'right' });
        doc.text('Quantity', 370, invoiceTableTop, { width: 90, align: 'right' });
        doc.text('Total', 470, invoiceTableTop, { width: 75, align: 'right' });

        generateHr(doc, invoiceTableTop + 20);

        // --- Table Rows ---
        
        let y = invoiceTableTop + 30;
        let subtotal = 0;
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            const itemName = item.medicine?.name || 'Unknown Item';
            const price = Number(item.price);
            const qty = item.quantity;
            const rowTotal = price * qty;
            subtotal += rowTotal;

            doc.font('Helvetica').fontSize(10).fillColor(darkGray);
            doc.text(itemName, 50, y, { width: 230 });
            doc.text(`Rs. ${price.toFixed(2)}`, 280, y, { width: 90, align: 'right' });
            doc.text(qty.toString(), 370, y, { width: 90, align: 'right' });
            doc.text(`Rs. ${rowTotal.toFixed(2)}`, 470, y, { width: 75, align: 'right' });

            generateHr(doc, y + 20);
            y += 30;
          });
        }

        // --- Totals Section ---
        const totalsTop = y + 20;
        doc.font('Helvetica').fontSize(10).fillColor(darkGray);
        doc.text('Subtotal:', 350, totalsTop, { width: 110, align: 'right' });
        doc.text(`Rs. ${subtotal.toFixed(2)}`, 470, totalsTop, { width: 75, align: 'right' });

        const discount = Number(order.discountAmount || 0);
        doc.fillColor(brandColor).text('Discount:', 350, totalsTop + 20, { width: 110, align: 'right' });
        doc.text(`- Rs. ${discount.toFixed(2)}`, 470, totalsTop + 20, { width: 75, align: 'right' });

        const gst = Number(order.gstAmount || 0);
        doc.fillColor(darkGray).text('GST (18% incl):', 350, totalsTop + 40, { width: 110, align: 'right' });
        doc.text(`Rs. ${gst.toFixed(2)}`, 470, totalsTop + 40, { width: 75, align: 'right' });

        const finalAmount = Number(order.finalAmount || 0);
        
        // Highlight Grand Total Box
        doc.rect(340, totalsTop + 65, 205, 30).fillColor(ultraLightGray).fill();
        doc.fillColor(darkGray).font('Helvetica-Bold').fontSize(12);
        doc.text('Grand Total:', 350, totalsTop + 75, { width: 110, align: 'right' });
        doc.fillColor(brandColor).text(`Rs. ${finalAmount.toFixed(2)}`, 470, totalsTop + 75, { width: 75, align: 'right' });

        // --- Footer ---
        doc.fontSize(10).fillColor(lightGray).font('Helvetica-Oblique')
           .text('Thank you for choosing Dosebox. Wishing you good health!', 50, 750, { align: 'center', width: 500 });
        
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
