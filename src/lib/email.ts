import nodemailer from 'nodemailer';

// Use environment variables for production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'test@dosebox.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

const FROM_EMAIL = '"DoseBox Support" <support@dosebox.com>';

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendOrderStatusEmail(user: any, order: any, newStatus: string) {
  const subject = `Your DoseBox Order #${order.id} is now ${newStatus}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      <p>Your order <strong>#${order.id}</strong> status has been updated to:</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0; color: #1F5C52;">${newStatus}</h3>
      </div>
      <p>Thank you for shopping with DoseBox!</p>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
}

export async function sendOrderCancelledEmail(
  user: any, 
  order: any, 
  cancelledBy: string, 
  refundMethod: string | null, 
  tokensGranted: number
) {
  const subject = `Order #${order.id} Cancelled`;
  
  let refundText = '';
  if (refundMethod === 'bank') {
    refundText = `Your refund of ₹${order.finalAmount} is being processed to your original payment method. `;
    if (tokensGranted > 0) {
      refundText += `<br/>As a gesture of goodwill, we have also credited <strong>${tokensGranted} DoseBox Tokens</strong> to your account!`;
    }
  } else if (refundMethod === 'tokens') {
    refundText = `Your refund has been processed as <strong>${tokensGranted} DoseBox Tokens</strong> (Order value + Bonus). You can use these on your next purchase.`;
  } else {
    refundText = `No refund is applicable for this order, or it was a Cash on Delivery order. If you have questions, please contact support.`;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      <p>Your order <strong>#${order.id}</strong> has been cancelled.</p>
      
      <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
        <h3 style="margin: 0 0 10px 0; color: #991b1b;">Refund Details</h3>
        <p style="margin: 0; color: #7f1d1d; line-height: 1.5;">${refundText}</p>
      </div>

      <p>If you have any questions, our support team is here to help.</p>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
}
