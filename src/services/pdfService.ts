import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
  orderId: number;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  gstAmount: number;
  finalAmount: number;
}

export class PdfService {
  public static generateInvoicePDF(res: Response, data: InvoiceData) {
    const doc = new PDFDocument({ margin: 50 });

    // Set Response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_Order_${data.orderId}.pdf`);

    doc.pipe(res);

    // Header / Brand Logo
    doc
      .fillColor('#005c53')
      .fontSize(20)
      .text('MrMed Healthcare', 50, 45)
      .fontSize(10)
      .fillColor('#718096')
      .text('Enterprise Online Pharmacy & Diagnostics', 50, 68)
      .text('Regd. Office: 124, Healthcare Boulevard, Tech City', 50, 80)
      .text('GSTIN: 27AAAAA1111A1Z1', 50, 92)
      .moveDown();

    // Invoice Meta Information (Right Aligned)
    doc
      .fillColor('#1a202c')
      .fontSize(16)
      .text('TAX INVOICE', 400, 45, { align: 'right' })
      .fontSize(10)
      .fillColor('#4a5568')
      .text(`Invoice No: #INV-OD-${data.orderId}`, 400, 65, { align: 'right' })
      .text(`Date: ${data.date}`, 400, 77, { align: 'right' })
      .text(`Payment: ${data.paymentStatus} (${data.paymentMethod})`, 400, 89, { align: 'right' })
      .moveDown();

    // Horizontal Rule line
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, 115)
      .lineTo(550, 115)
      .stroke();

    // Bill To & Ship To
    doc
      .fillColor('#1a202c')
      .fontSize(11)
      .text('Billed & Shipped To:', 50, 130, { underline: true })
      .fontSize(10)
      .fillColor('#2d3748')
      .text(`Name: ${data.customerName}`, 50, 145)
      .text(`Email: ${data.customerEmail}`, 50, 157)
      .text(`Phone: ${data.customerPhone || 'N/A'}`, 50, 169)
      .text(`Address: ${data.shippingAddress}`, 50, 181, { width: 450 })
      .moveDown(2);

    // Table Header
    const tableTop = 230;
    doc
      .fillColor('#1a202c')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item Description', 50, tableTop)
      .text('Quantity', 280, tableTop, { align: 'right' })
      .text('Unit Price (INR)', 370, tableTop, { align: 'right' })
      .text('Total (INR)', 470, tableTop, { align: 'right' })
      .font('Helvetica');

    doc
      .strokeColor('#cbd5e0')
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Table Body Loop
    let currentY = tableTop + 25;
    data.items.forEach((item) => {
      // Check if page overflows
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc
        .fontSize(9)
        .fillColor('#2d3748')
        .text(item.name, 50, currentY, { width: 220 })
        .text(item.quantity.toString(), 280, currentY, { align: 'right' })
        .text(`Rs. ${item.price.toFixed(2)}`, 370, currentY, { align: 'right' })
        .text(`Rs. ${item.total.toFixed(2)}`, 470, currentY, { align: 'right' });

      currentY += 20;
    });

    // Subtotals block
    const subtotalY = currentY + 15;
    doc
      .strokeColor('#cbd5e0')
      .moveTo(50, subtotalY - 5)
      .lineTo(550, subtotalY - 5)
      .stroke();

    doc
      .fontSize(9)
      .fillColor('#4a5568')
      .text('Subtotal:', 350, subtotalY)
      .text(`Rs. ${data.totalAmount.toFixed(2)}`, 470, subtotalY, { align: 'right' })
      
      .text('Discount:', 350, subtotalY + 15)
      .text(`- Rs. ${data.discountAmount.toFixed(2)}`, 470, subtotalY + 15, { align: 'right' })
      
      .text('GST (18% inclusive):', 350, subtotalY + 30)
      .text(`Rs. ${data.gstAmount.toFixed(2)}`, 470, subtotalY + 30, { align: 'right' });

    // Grand Total
    doc
      .strokeColor('#005c53')
      .lineWidth(1.5)
      .moveTo(330, subtotalY + 45)
      .lineTo(550, subtotalY + 45)
      .stroke();

    doc
      .fontSize(11)
      .fillColor('#005c53')
      .font('Helvetica-Bold')
      .text('Grand Total:', 350, subtotalY + 52)
      .text(`Rs. ${data.finalAmount.toFixed(2)}`, 470, subtotalY + 52, { align: 'right' })
      .font('Helvetica');

    // Terms
    doc
      .fillColor('#718096')
      .fontSize(8)
      .text('Terms & Conditions:', 50, 700)
      .text('1. This is a computer-generated tax invoice and requires no physical signature.', 50, 712)
      .text('2. Medicines once sold cannot be returned unless expired or damaged in transit.', 50, 722)
      .text('3. For support or returns, write to support@mrmed.com.', 50, 732);

    doc.end();
  }
}

export default PdfService;
