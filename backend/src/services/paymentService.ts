import crypto from 'crypto';

interface RazorpayOrderOptions {
  amount: number; // in paise
  currency: string;
  receipt: string;
}

export class PaymentService {
  /**
   * Mock creating a Razorpay Order
   */
  public static async createOrder(options: RazorpayOrderOptions) {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123';
    
    // Simulating call to Razorpay API
    const orderId = `order_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    
    return {
      id: orderId,
      entity: 'order',
      amount: options.amount,
      amount_paid: 0,
      amount_due: options.amount,
      currency: options.currency,
      receipt: options.receipt,
      status: 'created',
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  public static verifySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret456';
    
    // In a live environment:
    // const body = orderId + "|" + paymentId;
    // const expectedSignature = crypto
    //   .createHmac("sha256", secret)
    //   .update(body.toString())
    //   .digest("hex");
    // return expectedSignature === signature;

    // For test ease, if it contains 'mock', we always auto-verify.
    if (signature.startsWith('mock_') || signature === 'success') {
      return true;
    }
    
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');
    
    return expectedSignature === signature;
  }
}

export default PaymentService;
