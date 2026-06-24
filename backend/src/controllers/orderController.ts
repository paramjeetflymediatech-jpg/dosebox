import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  Order, OrderItem, Medicine, Coupon, Address, Prescription, User, Notification 
} from '../models';
import PdfService from '../services/pdfService';

export class OrderController {
  
  /**
   * Place a new order
   */
  public static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { items, couponCode, shippingAddressId, paymentMethod, prescriptionId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Shopping cart items are required' });
      }

      if (!shippingAddressId) {
        return res.status(400).json({ success: false, message: 'Shipping address is required' });
      }

      // 1. Verify address
      const address = await Address.findByPk(shippingAddressId);
      if (!address || address.userId !== userId) {
        return res.status(400).json({ success: false, message: 'Invalid shipping address' });
      }

      let subtotal = 0;
      let totalSavings = 0;
      let requiresPrescription = false;
      const checkedItems = [];

      // 2. Validate items & stock
      for (const item of items) {
        const medicine = await Medicine.findByPk(item.medicineId);
        if (!medicine) {
          return res.status(404).json({ success: false, message: `Medicine ID ${item.medicineId} not found` });
        }

        if (medicine.stock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}` 
          });
        }

        if (medicine.prescriptionRequired) {
          requiresPrescription = true;
        }

        const price = Number(medicine.price);
        const discPrice = medicine.discountPrice ? Number(medicine.discountPrice) : price;
        
        subtotal += price * item.quantity;
        totalSavings += (price - discPrice) * item.quantity;

        checkedItems.push({
          medicine,
          quantity: item.quantity,
          billingPrice: discPrice
        });
      }

      // 3. Handle Prescription verification
      let orderStatus = 'Confirmed';
      if (requiresPrescription) {
        if (!prescriptionId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Order contains prescription-required medicines. Please upload and attach a prescription.' 
          });
        }

        const prescription = await Prescription.findByPk(prescriptionId);
        if (!prescription || prescription.userId !== userId) {
          return res.status(400).json({ success: false, message: 'Invalid prescription selected' });
        }

        if (prescription.status === 'Pending') {
          orderStatus = 'Prescription Review';
        } else if (prescription.status === 'Rejected') {
          return res.status(400).json({ 
            success: false, 
            message: 'The selected prescription was rejected. Please upload a valid one.' 
          });
        }
      }

      // 4. Calculate Coupon Discount
      let couponDiscount = 0;
      let couponObj: any = null;
      if (couponCode) {
        couponObj = await Coupon.findOne({ where: { code: couponCode, active: true } });
        if (couponObj) {
          const now = new Date();
          if (new Date(couponObj.expiryDate) > now && subtotal >= Number(couponObj.minOrderValue)) {
            if (couponObj.discountType === 'Percentage') {
              couponDiscount = (subtotal - totalSavings) * (Number(couponObj.discountValue) / 100);
              if (couponObj.maxDiscount && couponDiscount > Number(couponObj.maxDiscount)) {
                couponDiscount = Number(couponObj.maxDiscount);
              }
            } else {
              couponDiscount = Number(couponObj.discountValue);
            }
          }
        }
      }

      const totalBill = subtotal - totalSavings - couponDiscount;
      // GST is inclusive in pricing but we break it down in display/PDF (18%)
      const gstAmount = totalBill * 0.18;
      
      const shippingFee = totalBill > 500 ? 0 : 50.00;
      const finalAmount = totalBill + shippingFee;

      // 5. Create Order
      const trackingTimeline = [
        { status: 'Pending', time: new Date().toISOString(), desc: 'Order received. Awaiting system logs.' },
        requiresPrescription ? { status: 'Prescription Review', time: new Date().toISOString(), desc: 'Awaiting prescription verification by Pharmacist.' } : null
      ].filter(Boolean);

      const order = await Order.create({
        userId,
        prescriptionId: requiresPrescription ? prescriptionId : null,
        status: orderStatus,
        totalAmount: subtotal,
        discountAmount: totalSavings + couponDiscount,
        gstAmount,
        finalAmount,
        paymentStatus: paymentMethod === 'COD' ? 'Unpaid' : 'Paid', // In a real payment loop, it is updated via Razorpay verify
        paymentMethod,
        trackingTimeline: JSON.stringify(trackingTimeline),
        couponId: couponObj ? couponObj.id : null,
        shippingAddressId
      });

      // 6. Create Order Items and deduct stock
      for (const entry of checkedItems) {
        await OrderItem.create({
          orderId: order.id,
          medicineId: entry.medicine.id,
          quantity: entry.quantity,
          price: entry.billingPrice
        });

        // Deduct inventory
        await entry.medicine.update({
          stock: entry.medicine.stock - entry.quantity
        });
      }

      // Send Customer Notification
      await Notification.create({
        userId,
        title: 'Order Placed successfully',
        message: `Your order #${order.id} has been placed. Status: ${order.status}`
      });

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get orders placed by current Customer
   */
  public static async getCustomerOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const orders = await Order.findAll({
        where: { userId },
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'images'] }] },
          { model: Address, as: 'shippingAddress' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all orders (Pharmacist & Admin)
   */
  public static async getAllOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const orders = await Order.findAll({
        where: filter,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] },
          { model: Address, as: 'shippingAddress' },
          { model: Prescription, as: 'prescription' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update order status (Pharmacist & Admin)
   */
  public static async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      const validStatuses = ['Pending', 'Prescription Review', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid order status transition' });
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Update timeline
      const timeline = JSON.parse(order.trackingTimeline || '[]');
      timeline.push({
        status,
        time: new Date().toISOString(),
        desc: remarks || `Order status updated to ${status}`
      });

      await order.update({
        status,
        trackingTimeline: JSON.stringify(timeline),
        paymentStatus: status === 'Delivered' && order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus
      });

      // Send User Notification
      await Notification.create({
        userId: order.userId,
        title: `Order Status: ${status}`,
        message: `Your order #${order.id} status is now ${status}.`
      });

      return res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: order
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Generate tax invoice PDF
   */
  public static async getInvoicePdf(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id, {
        include: [
          { model: User, as: 'user' },
          { model: Address, as: 'shippingAddress' },
          { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] }
        ]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Security check: Customer can only print their own invoices.
      if (req.user!.roleName === 'Customer' && order.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to download this invoice' });
      }

      const invoiceData = {
        orderId: order.id,
        date: new Date(order.createdAt as any).toLocaleDateString('en-IN'),
        customerName: order.user ? (order.user as any).name : 'Valued Customer',
        customerEmail: order.user ? (order.user as any).email : 'customer@email.com',
        customerPhone: order.user ? (order.user as any).phone : '',
        shippingAddress: order.shippingAddress 
          ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}`
          : 'No Address Stated',
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        items: order.items ? (order.items as any[]).map(item => ({
          name: item.medicine ? item.medicine.name : 'Unknown Medicine',
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.price) * item.quantity
        })) : [],
        totalAmount: Number(order.totalAmount),
        discountAmount: Number(order.discountAmount),
        gstAmount: Number(order.gstAmount),
        finalAmount: Number(order.finalAmount)
      };

      // Call PDF Generator Service
      PdfService.generateInvoicePDF(res, invoiceData);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default OrderController;
