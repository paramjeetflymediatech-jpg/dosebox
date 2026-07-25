export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { authenticateJWT } from '../../../../../middleware/auth';
import { Order, OrderItem, Medicine, User, Setting } from '../../../../../models';
import PDFDocument from 'pdfkit';

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numStr = Math.floor(num).toString();
  if (numStr.length > 9) return 'Overflow';
  
  const n: any = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Lac ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : ''; // Note: Indian numbering splits at 2 for crores, lakhs, thousands
  
  // Actually, fixing the regex indices:
  // n[1] = crores, n[2] = lakhs, n[3] = thousands, n[4] = hundreds, n[5] = tens
  str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lac ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  
  return str.trim();
}

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

        const sellerName = settings.enterprise_legal_name || 'Jagbir Pharmaceuticals Private Limited.';

        let dynamicAddress = '';
        if (settings.enterprise_address || settings.enterprise_city) {
          dynamicAddress = [
            settings.enterprise_address,
            settings.enterprise_city,
            settings.enterprise_state ? `${settings.enterprise_state}-${settings.enterprise_pincode || ''}` : ''
          ].filter(Boolean).join('\n');
        }

        const sellerAddress = dynamicAddress || `B-35, Building No. 6, Ansal Chamber-2,
Bhikaji Cama Place,
New Delhi - 110066`;
        const sellerPhone = settings.enterprise_phone || '011-43550667,9718641733,9718211733';
        const sellerDL = settings.enterprise_drug_license || 'WLF20B2025DL000670/WLF21B2025DL000659';
        const sellerGST = settings.enterprise_gst || '07AAECJ0285F1ZQ';

        const doc = new PDFDocument({ margin: 20, size: 'A4' });
        
        // Add watermark
        const watermarkPath = path.join(process.cwd(), 'mobile', 'src', 'assets', 'images', 'Media.jpg');
        try {
          doc.save();
          doc.opacity(0.1); // Light watermark
          const maxDimension = 300;
          // A4 dimensions are 595.28 x 841.89
          const x = (595.28 - maxDimension) / 2;
          const y = (841.89 - maxDimension) / 2;
          doc.image(watermarkPath, x, y, { 
            fit: [maxDimension, maxDimension],
            align: 'center',
            valign: 'center'
          });
          doc.restore();
        } catch (err) {
          console.error('Failed to add watermark:', err);
        }
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

        doc.lineWidth(0.5).strokeColor('#777777');

        // Outer box
        doc.rect(startX, 20, 555, 780).stroke();

        // 1. Top Header Box (Height: 120)
        doc.moveTo(205, 20).lineTo(205, 140).stroke(); // Divider 1
        doc.moveTo(400, 20).lineTo(400, 140).stroke(); // Divider 2

        // Seller Info (Left)
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000080').text(sellerName, 28, 28, { width: 169 });
        doc.font('Helvetica').fontSize(8).fillColor('black').text(sellerAddress, { width: 169 });
        doc.fontSize(7);
        doc.text(`Phone : ${sellerPhone}`, { width: 169, lineBreak: false });
        doc.text(`D.L.No. : ${sellerDL}`, { width: 169, lineBreak: false });
        doc.text(`GSTIN : ${sellerGST}`, { width: 169, lineBreak: false });

        // Middle Header
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000080').text('GST INVOICE', 205, 25, { width: 195, align: 'center' });
        doc.fontSize(10).text('CREDIT', 205, 40, { width: 195, align: 'center' });

        // Middle Sub-grid
        doc.moveTo(205, 55).lineTo(400, 55).stroke(); // horizontal 1
        doc.moveTo(205, 95).lineTo(400, 95).stroke(); // horizontal 2
        doc.moveTo(20, 140).lineTo(575, 140).stroke(); // Bottom of Header (full width)

        doc.moveTo(265, 55).lineTo(265, 140).stroke(); // Vert 1 in middle
        doc.moveTo(330, 55).lineTo(330, 140).stroke(); // Vert 2 in middle

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black');
        doc.text('Invoice No', 207, 60);
        doc.text('Invoice Date', 207, 100);
        doc.text('Due Date', 207, 112);

        doc.text(`OD-${order.id}`, 267, 60);
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
        doc.text(orderDate, 267, 100);
        doc.text(orderDate, 267, 112);

        doc.text('Order No.', 332, 60);
        doc.text('Order Date', 332, 72);
        doc.text('L.R. No.', 332, 100);
        doc.text('L.R. Date', 332, 112);

        // Right Box: Party Name (Buyer)
        doc.font('Helvetica').fontSize(8).fillColor('black');
        doc.text('Customer Name :', 408, 28);
        doc.font('Helvetica-Bold').fontSize(9).text(order.user?.name?.toUpperCase() || 'CUSTOMER', 408, 38);
        doc.font('Helvetica').fontSize(8);
        doc.text(order.user?.address || 'Address Not Provided', 408, 51, { width: 159 });
        doc.text(`PHONE. : ${order.user?.phone || 'N/A'}`, 408, 81);
        // doc.text(`D.L.No. : 21B-WLF21B2023DL000882`, 402, 85); // Placeholder DL
        // doc.text(`GSTIN : 07AAMPB0370Q1ZI`, 402, 95); // Placeholder GSTIN

        // 2. Table Headers (y = 140 to 155)
        doc.rect(20, 140, 555, 15).fillColor('#d1d5db').fill();
        doc.fillColor('black');

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
          currentX += col.width;
        });

        // Draw vertical lines separately
        currentX = startX;
        doc.lineWidth(0.5).strokeColor('#777777');
        cols.forEach((col, i) => {
          if (i > 0) {
            doc.moveTo(currentX, 140).lineTo(currentX, 600).stroke();
          }
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
            const mrp = Number(medicine.price || rate).toFixed(2); // Dynamic MRP

            doc.font('Helvetica').fontSize(8);

            let cx = startX;
            doc.text((idx + 1).toString(), cx, y, { width: 20, align: 'center' }); cx += 20;
            doc.text(qty.toString(), cx, y, { width: 30, align: 'center' }); cx += 30;
            doc.text(medicine.manufacturer?.substring(0, 6)?.toUpperCase() || 'GEN', cx + 2, y, { width: 36 }); cx += 40;
            doc.text(medicine.packSize?.substring(0, 8)?.toUpperCase() || '1 PACK', cx + 2, y, { width: 36 }); cx += 40;
            doc.text(medicine.name?.toUpperCase() || 'ITEM', cx + 2, y, { width: 126 }); cx += 130;
            doc.text('MB' + String(order.id).padStart(4, '0'), cx + 2, y, { width: 46 }); cx += 50;
            doc.text('12/28', cx + 2, y, { width: 31 }); cx += 35;
            doc.text(medicine.hsnCode || '300490', cx + 2, y, { width: 36 }); cx += 40;
            doc.text(mrp, cx, y, { width: 36, align: 'right' }); cx += 40;
            doc.text(rate.toFixed(2), cx, y, { width: 36, align: 'right' }); cx += 40;
            doc.text('0.00', cx, y, { width: 21, align: 'right' }); cx += 25;
            doc.text('9.00%', cx, y, { width: 26, align: 'right' }); cx += 30;
            doc.text(value.toFixed(2), cx, y, { width: 31, align: 'right' });
            y += 12;
          });
        }

        const totalMRP = Number(order.totalAmount) || 0;
        const totalDiscountSaved = Number(order.discountAmount) || 0;
        const finalAmount = Number(order.finalAmount) || 0;
        const gstAmount = Number(order.gstAmount) || 0;
        const tokensUsed = Number(order.tokensUsed || 0);

        const itemsTotalBilling = (order.items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0);
        const productDiscount = Math.max(0, totalMRP - itemsTotalBilling);
        const couponDiscount = Math.max(0, totalDiscountSaved - productDiscount - tokensUsed);

        const baseTotal = totalMRP - totalDiscountSaved;
        let shippingFee = 0;
        if (Math.abs(finalAmount - (baseTotal + gstAmount)) <= 51) {
          shippingFee = Math.max(0, Math.round(finalAmount - (baseTotal + gstAmount)));
        } else {
          shippingFee = Math.max(0, Math.round(finalAmount - baseTotal));
        }

        // 4. Footer Section (y = 600)
        doc.rect(20, 600, 330, 14).fillColor('#d1d5db').fill();
        doc.fillColor('black');

        doc.moveTo(20, 600).lineTo(575, 600).stroke(); // Top of footer
        doc.moveTo(20, 720).lineTo(575, 720).stroke(); // Above Terms

        // Vertical dividers in footer
        doc.moveTo(350, 600).lineTo(350, 720).stroke();
        doc.moveTo(450, 600).lineTo(450, 720).stroke();

        // Tax Summary vertical dividers
        [85, 145, 205, 275].forEach(vx => {
          doc.moveTo(vx, 600).lineTo(vx, 672).stroke();
        });

        // Left Footer: Tax Summary
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('CLASS', 25, 604);
        doc.text('TOTAL', 92, 604);
        doc.text('SCHEME', 152, 604);
        doc.text('DISCOUNT', 212, 604);
        doc.text('SGST', 282, 604);
        doc.moveTo(20, 614).lineTo(350, 614).stroke(); // Header line

        const halfGst = (gstAmount / 2).toFixed(2);

        doc.font('Helvetica').fontSize(8);
        doc.text('GST 18.00%', 25, 617);
        doc.text(baseTotal.toFixed(2), 92, 617);
        doc.text('0.00', 152, 617);
        doc.text(halfGst, 212, 617);
        doc.text(halfGst, 282, 617);

        doc.text('GST 12.00%', 25, 629);
        doc.text('0.00', 92, 629);
        doc.text('0.00', 152, 629);
        doc.text('0.00', 212, 629);
        doc.text('0.00', 282, 629);

        doc.text('GST 5.00%', 25, 641);
        doc.text('0.00', 92, 641);
        doc.text('0.00', 152, 641);
        doc.text('0.00', 212, 641);
        doc.text('0.00', 282, 641);

        doc.moveTo(20, 655).lineTo(350, 655).stroke(); // Above TOTAL
        doc.font('Helvetica-Bold');
        doc.text('TOTAL', 25, 660);
        doc.text(baseTotal.toFixed(2), 92, 660);
        doc.text('0.00', 152, 660);
        doc.text(halfGst, 212, 660);
        doc.text(halfGst, 282, 660);

        doc.moveTo(20, 672).lineTo(450, 672).stroke();
        doc.font('Helvetica-Oblique').fontSize(8);
        const amountWords = numberToWords(Number(order.finalAmount || 0));
        doc.text(`Rs. ${amountWords} only`, 25, 677, { width: 420 });
        doc.text('MSG: RTGS/NEFT-A/C 005563400000856', 25, 689);
        doc.text('IFSC-YESB0000055, YES BANK LTD, GREEN PARK, N.DELHI', 25, 699);

        // Middle Footer: Items & Qty
        doc.font('Helvetica').fontSize(8);
        doc.text('Total Items :-', 355, 615);
        doc.text((order.items?.length || 0).toString(), 420, 615);
        doc.text('Total Qty :-', 355, 627);
        doc.text(totalQty.toString(), 420, 627);

        // Right Footer: Values
        doc.font('Helvetica-Bold').fontSize(8);
        
        const summaryX = 455;
        const valueX = 520;
        const labelWidth = 70;
        const valWidth = 50;
        
        let ry = 602;
        
        doc.text('Total MRP', summaryX, ry);
        doc.text(totalMRP.toFixed(2), valueX, ry, { width: valWidth, align: 'right' });
        ry += 11;
        
        // Draw line under Total MRP
        doc.moveTo(450, ry - 2).lineTo(575, ry - 2).stroke();
        ry += 4; // Add a little extra spacing after the line

        doc.font('Helvetica').fontSize(8);
        if (productDiscount > 0) {
          doc.text('Dosebox Discount', summaryX, ry);
          doc.text(`-${productDiscount.toFixed(2)}`, valueX, ry, { width: valWidth, align: 'right' });
          ry += 11;
        }
        
        if (couponDiscount > 0) {
          doc.text('Promo Discount', summaryX, ry);
          doc.text(`-${couponDiscount.toFixed(2)}`, valueX, ry, { width: valWidth, align: 'right' });
          ry += 11;
        }
        
        doc.font('Helvetica-Bold');
        doc.text('Cart Total', summaryX, ry);
        doc.text((totalMRP - productDiscount).toFixed(2), valueX, ry, { width: valWidth, align: 'right' });
        ry += 11;
        
        doc.font('Helvetica');
        doc.text('GST (18%)', summaryX, ry);
        doc.text(gstAmount.toFixed(2), valueX, ry, { width: valWidth, align: 'right' });
        ry += 11;
        
        doc.text('Delivery Charges', summaryX, ry);
        doc.text(shippingFee > 0 ? shippingFee.toFixed(2) : 'Free', valueX, ry, { width: valWidth, align: 'right' });
        ry += 11;
        
        if (tokensUsed > 0) {
          doc.text('Tokens Used', summaryX, ry);
          doc.text(`-${tokensUsed.toFixed(2)}`, valueX, ry, { width: valWidth, align: 'right' });
          ry += 11;
        }

        // Grand Total Box
        doc.rect(450, 672, 125, 48).fillColor('#d1d5db').fill(); // Fill gray
        doc.fillColor('black').font('Helvetica').fontSize(10);
        doc.text('Grand Total', 450, 680, { width: 125, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(Number(order.finalAmount || 0).toFixed(2), 450, 695, { width: 125, align: 'center' });

        // Bottom T&C and Signature
        doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
        doc.text('Terms & Conditions', 25, 725);
        doc.font('Helvetica').fontSize(8);
        doc.text('Goods once sold will not be taken back or exchanged.', 25, 737);
        doc.text('All disputes subject to Jurisdication only.', 25, 747);
        doc.text('Bills not paid due date will attract 24% interest.', 25, 757);

        doc.font('Helvetica-Bold').fontSize(9);
        doc.text(`FOR  ${sellerName}`, 300, 725, { width: 270, align: 'center' });
        doc.text('Authorised Signatory', 300, 760, { width: 270, align: 'center' });

        doc.moveTo(250, 720).lineTo(250, 780).stroke(); // T&C vertical divider
        doc.moveTo(20, 780).lineTo(575, 780).stroke(); // Close the bottom of the table

        // Final bottom message
        doc.font('Helvetica-Oblique').fontSize(7);
        doc.text('I am satisfied with Marg ERP | Computerise YOUR SHOP Rs.5550 | Stock,Accounts & GST | Call 01146658600,7042696260,7042696263', 20, 785, { width: 555, align: 'center' });

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
