import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../middleware/auth';
import { 
  Order, OrderItem, Medicine, Coupon, Address, Prescription, User, Notification 
} from '../../../models';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth; // Return error response

    const userId = userAuth.id;
    const body = await req.json().catch(() => ({}));
    const { items, couponCode, shippingAddressId, shippingAddress, paymentMethod, prescriptionId, useRewardPoints } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Shopping cart items are required' }, { status: 400 });
    }

    let finalAddressId = shippingAddressId;

    if (shippingAddress) {
      const [addr] = await Address.findOrCreate({
        where: { userId, street: shippingAddress.street, zipCode: shippingAddress.zipCode },
        defaults: {
          title: shippingAddress.title || 'Home',
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country || 'India',
          isDefault: true,
          userId
        }
      });
      finalAddressId = addr.id;
    }

    if (!finalAddressId) {
      return NextResponse.json({ success: false, message: 'Shipping address is required' }, { status: 400 });
    }

    const address = await Address.findByPk(finalAddressId);
    if (!address || address.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Invalid shipping address' }, { status: 400 });
    }

    // Pass the real DB ID to the order creation
    const dbShippingAddressId = finalAddressId;

    let subtotal = 0;
    let totalSavings = 0;
    let requiresPrescription = false;
    const checkedItems = [];

    for (const item of items) {
      const medicine = await Medicine.findByPk(item.medicineId);
      if (!medicine) {
        return NextResponse.json({ success: false, message: `Medicine ID ${item.medicineId} not found` }, { status: 404 });
      }

      if (medicine.stock < item.quantity) {
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}` 
        }, { status: 400 });
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

    let orderStatus = 'Confirmed';
    if (requiresPrescription) {
      if (!prescriptionId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Order contains prescription-required medicines. Please upload and attach a prescription.' 
        }, { status: 400 });
      }

      const prescription = await Prescription.findByPk(prescriptionId);
      if (!prescription || prescription.userId !== userId) {
        return NextResponse.json({ success: false, message: 'Invalid prescription selected' }, { status: 400 });
      }

      if (prescription.status === 'Pending') {
        orderStatus = 'Prescription Review';
      } else if (prescription.status === 'Rejected') {
        return NextResponse.json({ 
          success: false, 
          message: 'The selected prescription was rejected. Please upload a valid one.' 
        }, { status: 400 });
      }
    }

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
    const gstAmount = totalBill * 0.18;
    const shippingFee = totalBill > 500 ? 0 : 50.00;
    let finalAmount = totalBill + shippingFee;

    let pointsUsed = 0;
    const userRecord = await User.findByPk(userId);
    if (useRewardPoints && userRecord && (userRecord.rewardPoints || 0) > 0) {
      pointsUsed = Math.min(userRecord.rewardPoints || 0, finalAmount);
      finalAmount -= pointsUsed;
    }

    const trackingTimeline = [
      { status: 'Pending', time: new Date().toISOString(), desc: 'Order received. Awaiting system logs.' },
      requiresPrescription ? { status: 'Prescription Review', time: new Date().toISOString(), desc: 'Awaiting prescription verification by Pharmacist.' } : null
    ].filter(Boolean);

    const order = await Order.create({
      userId,
      prescriptionId: requiresPrescription ? prescriptionId : null,
      status: orderStatus,
      totalAmount: subtotal,
      discountAmount: totalSavings + couponDiscount + pointsUsed,
      gstAmount,
      finalAmount,
      paymentStatus: 'Unpaid',
      paymentMethod,
      trackingTimeline: JSON.stringify(trackingTimeline),
      couponId: couponObj ? couponObj.id : null,
      shippingAddressId: dbShippingAddressId
    });

    for (const entry of checkedItems) {
      await OrderItem.create({
        orderId: order.id,
        medicineId: entry.medicine.id,
        quantity: entry.quantity,
        price: entry.billingPrice
      });

      await entry.medicine.update({
        stock: entry.medicine.stock - entry.quantity
      });
    }

    if (pointsUsed > 0 && userRecord) {
      await userRecord.update({
        rewardPoints: (userRecord.rewardPoints || 0) - pointsUsed
      });
    }

    await Notification.create({
      userId,
      title: 'Order Placed successfully',
      message: `Your order #${order.id} has been placed. Status: ${order.status}`
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const { searchParams } = new URL(req.url);
    
    // If admin or pharmacist
    if (userAuth.roleName === 'Admin' || userAuth.roleName === 'Pharmacist') {
      const status = searchParams.get('status');
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

      return NextResponse.json({ success: true, data: orders }, { status: 200 });
    } else {
      // Customer
      const orders = await Order.findAll({
        where: { userId: userAuth.id },
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'images'] }] },
          { model: Address, as: 'shippingAddress' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return NextResponse.json({ success: true, data: orders }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
