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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F7F8FA; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F7F8FA; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
              <!-- Header Image / Logo Area -->
              <tr>
                <td align="center" style="background-color: #1F5C52; padding: 40px 0;">
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">DoseBox</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="color: #0D1B2A; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Order Status Update</h2>
                  <p style="color: #64748B; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                    Hi <strong>${user.name}</strong>,<br><br>
                    We wanted to let you know that there's an update regarding your order <strong>#${order.id}</strong>.
                  </p>
                  
                  <!-- Status Box -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td align="center" style="padding: 24px;">
                        <span style="display: block; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Current Status</span>
                        <span style="display: block; color: #1F5C52; font-size: 28px; font-weight: 800;">${newStatus}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #64748B; font-size: 16px; line-height: 24px; margin: 0 0 40px 0; text-align: center;">
                    You can track the live progress of your delivery directly from the DoseBox app.
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="dosebox://" style="display: inline-block; background-color: #1F5C52; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">Track My Order</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 32px 40px; border-top: 1px solid #F1F5F9; text-align: center;">
                  <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">Thank you for choosing DoseBox.</p>
                  <p style="color: #CBD5E1; font-size: 12px; margin: 0;">If you have any questions, simply reply to this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
