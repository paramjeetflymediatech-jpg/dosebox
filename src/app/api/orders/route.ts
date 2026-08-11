export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../middleware/auth';
import { Order, OrderItem, Medicine, Coupon, Address, User, Notification, Prescription, Supplier, DoseboxTokenTransaction } from '../../../models';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth; // Return error response

    const userId = userAuth.id;
    const body = await req.json().catch(() => ({}));
    const { items, couponCode, shippingAddressId, shippingAddress, paymentMethod, prescriptionId, useDoseboxTokens, doseboxTokensToUse } = body;

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
      if (!item.medicineId) {
        return NextResponse.json({ success: false, message: `Invalid item: missing medicineId` }, { status: 400 });
      }
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

    let orderStatus = paymentMethod === 'PhonePe' ? 'Payment Pending' : 'Confirmed';
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

      if (prescription.status === 'Pending' || prescription.status === 'Processing') {
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
    const gstAmount = totalBill * 0.05;
    const shippingFee = totalBill > 500 ? 0 : 50.00;
    let finalAmount = totalBill + gstAmount + shippingFee;

    let pointsUsed = 0;
    const userRecord = await User.findByPk(userId);
    if (useDoseboxTokens && userRecord && (userRecord.doseboxTokens || 0) > 0) {
      if (doseboxTokensToUse !== undefined) {
        pointsUsed = Math.min(Number(doseboxTokensToUse), userRecord.doseboxTokens || 0, finalAmount);
      } else {
        pointsUsed = Math.min(userRecord.doseboxTokens || 0, finalAmount);
      }
      finalAmount = Math.max(0, finalAmount - pointsUsed);
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
      shippingAddressId: dbShippingAddressId,
      tokensUsed: pointsUsed
    });

    for (const entry of checkedItems) {
      await OrderItem.create({
        orderId: order.id,
        medicineId: entry.medicine.id,
        quantity: entry.quantity,
        price: entry.billingPrice
      });

      const newStock = entry.medicine.stock - entry.quantity;
      await entry.medicine.update({
        stock: newStock
      });

      // OUT OF STOCK NOTIFICATION LOGIC
      if (newStock <= 0) {
        if (entry.medicine.supplierId) {
          const supplier = await Supplier.findByPk(entry.medicine.supplierId);
          if (supplier) {
            // Log the simulated email to console
            console.log(`\n======================================================`);
            console.log(`[AUTOMATIC SUPPLIER NOTIFICATION] - OUT OF STOCK ALERT`);
            console.log(`To: ${supplier.email} (${supplier.name})`);
            console.log(`Subject: Urgent: Restock Request for ${entry.medicine.name}`);
            console.log(`Message: Dear ${supplier.name}, the medicine "${entry.medicine.name}" has gone out of stock. Please supply more inventory. Current stock: ${newStock}.`);
            console.log(`======================================================\n`);

            // Optionally create an admin notification in system
            await Notification.create({
              userId: 1, // Assumes Admin user ID is 1 (or can be broadcast to admins)
              title: 'Supplier Notification Sent',
              message: `Automated out of stock request sent to supplier ${supplier.name} for ${entry.medicine.name}.`
            });
          }
        } else {
          // Admin notification if no supplier is linked
          await Notification.create({
            userId: 1,
            title: 'Out of Stock (No Supplier)',
            message: `${entry.medicine.name} is out of stock but has no linked supplier.`
          });
        }
      }
    }

    if (pointsUsed > 0 && userRecord) {
      await userRecord.update({
        doseboxTokens: (userRecord.doseboxTokens || 0) - pointsUsed
      });

      await DoseboxTokenTransaction.create({
        userId: userRecord.id,
        orderId: order.id,
        tokens: pointsUsed,
        type: 'Redeemed',
        description: `Redeemed for Order #${order.id}`
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
    console.error('[ORDER API ERROR]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // If admin, superadmin, leadership, medico, pharmacist, doctor
    const staffRoles = ['Admin', 'SuperAdmin', 'Pharmacist', 'Leadership', 'Medico', 'Doctor'];
    if (staffRoles.some(role => role.toLowerCase() === userAuth.roleName?.trim().toLowerCase())) {
      const status = searchParams.get('status');
      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where: filter,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] },
          { model: Address, as: 'shippingAddress' },
          { model: Prescription, as: 'prescription' }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return NextResponse.json({
        success: true,
        data: orders,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          pageSize: limit
        }
      }, { status: 200 });
    } else {
      // Customer
      const { count, rows: orders } = await Order.findAndCountAll({
        where: { userId: userAuth.id },
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'images'] }] },
          { model: Address, as: 'shippingAddress' }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return NextResponse.json({
        success: true,
        data: orders,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          pageSize: limit
        }
      }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
