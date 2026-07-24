export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Order, OrderItem, Medicine, User, Setting } from '../../../../../models';
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

    // Only allow Admin or the order owner to view the invoice
    if (Number(order.userId) !== Number(userAuth.id) && userAuth.roleName !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    return new Promise<NextResponse>(async (resolve, reject) => {
      try {
        // Fetch Settings for Enterprise Info
        const settingsRaw = await Setting.findAll();
        const settings: any = {};
        settingsRaw.forEach((s: any) => settings[s.key] = s.value);

        const sellerName = settings.enterprise_legal_name || 'DOSEBOX HEALTHCARE PVT LTD.';

        let dynamicAddress = '';
        if (settings.enterprise_address || settings.enterprise_city) {
          dynamicAddress = [
            settings.enterprise_address,
            settings.enterprise_city,
            settings.enterprise_state ? `${settings.enterprise_state}-${settings.enterprise_pincode || ''}` : ''
          ].filter(Boolean).join('\n');
        }

        const sellerAddress = dynamicAddress || '123 HEALTH AVENUE, SECTOR 4\nNEW DELHI-110001';
        const sellerPhone = settings.enterprise_phone || '011-12345678, 9876543210';
        const sellerDL = settings.enterprise_drug_license || 'DL-123456789';
        const sellerGST = settings.enterprise_gst || '07AABCU9603R1ZX';

        const doc = new PDFDocument({ margin: 20, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const response = new NextResponse(pdfBuffer);
          response.headers.set('Content-Type', 'application/pdf');
          response.headers.set('Content-Disposition', `attachment; filename=Invoice_OD-${order.id}.pdf`);
          resolve(response);
        });

        const startX = 20;
        const endX = 575;

        doc.lineWidth(1).strokeColor('black');

        // Outer box
        doc.rect(startX, 20, 555, 780).stroke();

        // 1. Top Header Box (Height: 120)
        doc.moveTo(180, 20).lineTo(180, 140).stroke(); // Divider 1
        doc.moveTo(400, 20).lineTo(400, 140).stroke(); // Divider 2

        // Seller Info (Left)
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000080').text(sellerName, 22, 22, { width: 156 });
        doc.font('Helvetica').fontSize(8).fillColor('black').text(sellerAddress, 22, 34, { width: 156 });
        doc.text(`Phone : ${sellerPhone}`, 22, 65, { width: 156 });
        doc.text(`D.L.No. : ${sellerDL}`, 22, 75, { width: 156 });
        doc.text(`GSTIN : ${sellerGST}`, 22, 85, { width: 156 });

        // Middle Header
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000080').text('GST INVOICE', 180, 25, { width: 220, align: 'center' });
        doc.fontSize(10).text('CREDIT', 180, 40, { width: 220, align: 'center' });

        // Middle Sub-grid
        doc.moveTo(180, 55).lineTo(400, 55).stroke(); // horizontal 1
        doc.moveTo(180, 95).lineTo(400, 95).stroke(); // horizontal 2
        doc.moveTo(20, 140).lineTo(575, 140).stroke(); // Bottom of Header (full width)

        doc.moveTo(250, 55).lineTo(250, 140).stroke(); // Vert 1 in middle
        doc.moveTo(330, 55).lineTo(330, 140).stroke(); // Vert 2 in middle

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black');
        doc.text('Invoice No', 182, 60);
        doc.text('Invoice Date', 182, 100);
        doc.text('Due Date', 182, 112);

        doc.text(`OD-${order.id}`, 252, 60);
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
        doc.text(orderDate, 252, 100);
        doc.text(orderDate, 252, 112);

        doc.text('Order No.', 332, 60);
        doc.text('Order Date', 332, 72);
        doc.text('L.R. No.', 332, 100);
        doc.text('L.R. Date', 332, 112);

        // Right Box: Party Name (Buyer)
        doc.font('Helvetica').fontSize(8).fillColor('black');
        doc.text('Customer Name :', 402, 22);
        doc.font('Helvetica-Bold').fontSize(9).text(order.user?.name?.toUpperCase() || 'CUSTOMER', 402, 32);
        doc.font('Helvetica').fontSize(8);
        doc.text(order.user?.address || 'Address Not Provided', 402, 45, { width: 170 });
        doc.text(`PHONE. : ${order.user?.phone || 'N/A'}`, 402, 75);
        // doc.text(`D.L.No. : 21B-WLF21B2023DL000882`, 402, 85); // Placeholder DL
        // doc.text(`GSTIN : 07AAMPB0370Q1ZI`, 402, 95); // Placeholder GSTIN

        // 2. Table Headers (y = 140 to 155)
        const cols = [
          { name: 'S.', width: 20 },
          { name: 'Qty.', width: 30 },
          { name: 'Mfr', width: 40 },
          { name: 'Pack', width: 40 },
          { name: 'Product Name', width: 130 },
          { name: 'Batch', width: 50 },
          { name: 'Exp', width: 35 },
          { name: 'HSN', width: 40 },
          { name: 'M.R.P', width: 40 },
          { name: 'Rate', width: 40 },
          { name: 'Dis', width: 25 },
          { name: 'SGST', width: 30 },
          { name: 'Value', width: 35 }
        ];

        let currentX = startX;
        doc.font('Helvetica-Bold').fontSize(8);
        cols.forEach((col, i) => {
          doc.text(col.name, currentX + 2, 144, { width: col.width - 4, align: 'center' });
          if (i > 0) doc.moveTo(currentX, 140).lineTo(currentX, 600).stroke(); // Vertical lines
          currentX += col.width;
        });
        doc.moveTo(20, 155).lineTo(575, 155).stroke(); // Header bottom

        // 3. Table Rows
        let y = 160;
        let totalQty = 0;
        let totalValue = 0;

        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any, idx: number) => {
            const medicine = item.medicine || {};
            const qty = item.quantity;
            totalQty += qty;
            const rate = Number(item.price);
            const value = qty * rate;
            totalValue += value;
            const mrp = (rate * 1.2).toFixed(2); // Mock MRP

            doc.font('Helvetica').fontSize(8);

            let cx = startX;
            doc.text((idx + 1).toString(), cx, y, { width: 20, align: 'center' }); cx += 20;
            doc.text(qty.toString(), cx, y, { width: 30, align: 'center' }); cx += 30;
            doc.text(medicine.manufacturer?.substring(0, 6)?.toUpperCase() || 'GEN', cx + 2, y, { width: 36 }); cx += 40;
            doc.text('1*10TA', cx + 2, y, { width: 36 }); cx += 40;
            doc.text(medicine.name?.toUpperCase() || 'ITEM', cx + 2, y, { width: 126 }); cx += 130;
            doc.text('MB00' + (idx + 1), cx + 2, y, { width: 46 }); cx += 50;
            doc.text('12/28', cx + 2, y, { width: 31 }); cx += 35;
            doc.text('300490', cx + 2, y, { width: 36 }); cx += 40;
            doc.text(mrp, cx, y, { width: 36, align: 'right' }); cx += 40;
            doc.text(rate.toFixed(2), cx, y, { width: 36, align: 'right' }); cx += 40;
            doc.text('0.00', cx, y, { width: 21, align: 'right' }); cx += 25;
            doc.text('2.50', cx, y, { width: 26, align: 'right' }); cx += 30;
            doc.text(value.toFixed(2), cx, y, { width: 31, align: 'right' });
            y += 12;
          });
        }

        // 4. Footer Section (y = 600)
        doc.moveTo(20, 600).lineTo(575, 600).stroke(); // Top of footer
        doc.moveTo(20, 720).lineTo(575, 720).stroke(); // Above Terms

        // Vertical dividers in footer
        doc.moveTo(350, 600).lineTo(350, 720).stroke();
        doc.moveTo(450, 600).lineTo(450, 720).stroke();

        // Left Footer: Tax Summary
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('CLASS', 22, 602);
        doc.text('TOTAL', 90, 602);
        doc.text('SCHEME', 150, 602);
        doc.text('DISCOUNT', 210, 602);
        doc.text('SGST', 280, 602);
        doc.moveTo(20, 612).lineTo(350, 612).stroke(); // Header line

        doc.font('Helvetica').fontSize(8);
        doc.text('GST 5.00%', 22, 615);
        doc.text(totalValue.toFixed(2), 90, 615);
        doc.text('0.00', 150, 615);
        doc.text('0.00', 210, 615);
        const sgstValue = Number(order.gstAmount || 0) / 2;
        doc.text(sgstValue.toFixed(2), 280, 615);

        doc.text('GST 12.00%', 22, 627);
        doc.text('0.00', 90, 627);
        doc.text('0.00', 150, 627);
        doc.text('0.00', 210, 627);
        doc.text('0.00', 280, 627);

        doc.text('GST 18.00%', 22, 639);
        doc.text('0.00', 90, 639);
        doc.text('0.00', 150, 639);
        doc.text('0.00', 210, 639);
        doc.text('0.00', 280, 639);

        doc.moveTo(20, 655).lineTo(350, 655).stroke(); // Above TOTAL
        doc.font('Helvetica-Bold');
        doc.text('TOTAL', 22, 660);
        doc.text(totalValue.toFixed(2), 90, 660);
        doc.text('0.00', 150, 660);
        doc.text('0.00', 210, 660);
        doc.text(sgstValue.toFixed(2), 280, 660);

        doc.moveTo(20, 672).lineTo(450, 672).stroke();
        doc.font('Helvetica-Oblique').fontSize(7);
        doc.text('Rs. ' + Number(order.finalAmount || 0).toFixed(2) + ' only', 22, 675);
        doc.text('MSG: RTGS/NEFT-A/C 00556340000856 IFSC-YESB0000055 YES BANK LTD', 22, 685);

        // Middle Footer: Items & Qty
        doc.font('Helvetica').fontSize(8);
        doc.text('Total Items :-', 355, 615);
        doc.text((order.items?.length || 0).toString(), 420, 615);
        doc.text('Total Qty :-', 355, 627);
        doc.text(totalQty.toString(), 420, 627);

        // Right Footer: Values
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('TOTAL', 455, 602);
        doc.text(totalValue.toFixed(2), 520, 602, { width: 50, align: 'right' });

        doc.font('Helvetica').fontSize(8);
        doc.text('DIS AMT.', 455, 615);
        doc.text(Number(order.discountAmount || 0).toFixed(2), 520, 615, { width: 50, align: 'right' });

        doc.text('SGST PAYBLE', 455, 627);
        doc.text(sgstValue.toFixed(2), 520, 627, { width: 50, align: 'right' });

        doc.text('ADD/LESS', 455, 639);
        doc.text('0.00', 520, 639, { width: 50, align: 'right' });

        doc.text('CR/DR NOTE', 455, 651);
        doc.text('0.00', 520, 651, { width: 50, align: 'right' });

        // Grand Total Box
        doc.rect(450, 672, 125, 48).fillColor('#d1d5db').fill(); // Fill gray
        doc.fillColor('black').font('Helvetica').fontSize(10);
        doc.text('Grand Total', 450, 680, { width: 125, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(Number(order.finalAmount || 0).toFixed(2), 450, 695, { width: 125, align: 'center' });

        // Bottom T&C and Signature
        doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
        doc.text('Terms & Conditions', 22, 725);
        doc.font('Helvetica').fontSize(8);
        doc.text('Goods once sold will not be taken back or exchanged.', 22, 737);
        doc.text('All disputes subject to Jurisdiction only.', 22, 747);
        doc.text('Bills not paid due date will attract 24% interest.', 22, 757);

        doc.font('Helvetica-Bold').fontSize(9);
        doc.text(`FOR  ${sellerName}`, 300, 725, { width: 270, align: 'center' });
        doc.text('Authorised Signatory', 300, 760, { width: 270, align: 'center' });

        doc.moveTo(250, 720).lineTo(250, 780).stroke(); // T&C vertical divider

        // Final bottom message
        doc.font('Helvetica-Oblique').fontSize(7);
        doc.text('I am satisfied with DoseBox ERP | Computerise YOUR SHOP | Stock, Accounts & GST', 20, 785, { width: 555, align: 'center' });

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
