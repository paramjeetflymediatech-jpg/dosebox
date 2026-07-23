export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Order, Notification, User, Address, OrderItem, Medicine } from '../../../../models';
import { sendOrderStatusEmail, sendOrderCancelledEmail } from '../../../../lib/email';
import { initiatePhonePeRefund } from '../../payments/phonepe/refund/route';
import { getLogisticsProvider } from '../../../../lib/logistics';
import { sendPushNotification } from '../../../../lib/push';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const authCheck = authorizeRoles(userAuth, 'SuperAdmin', 'Admin', 'Pharmacist', 'Leadership');
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await req.json();
    const { status, paymentStatus, trackingMessage, cancelReason } = body;

    const order = await Order.findByPk(params.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] }
      ]
    });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const shippingAddress = await Address.findByPk(order.shippingAddressId);

    const user = await User.findByPk(order.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let updated = false;

    if (status && status !== order.status) {
      order.status = status;
      updated = true;
    }

    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      order.paymentStatus = paymentStatus;
      updated = true;
    }

    if (trackingMessage) {
      let timeline = [];
      try { timeline = JSON.parse(order.trackingTimeline || '[]'); } catch(e){}
      timeline.push({
        status: status || order.status,
        time: new Date().toISOString(),
        desc: trackingMessage
      });
      order.trackingTimeline = JSON.stringify(timeline);
      updated = true;
    }

    if (updated) {
      // ----------------------------------------------------
      // ADMIN CANCELLATION LOGIC
      // ----------------------------------------------------
      if (order.status === 'Cancelled' && !order.cancelledBy) {
        order.cancelledBy = 'admin';
        order.cancelReason = cancelReason || 'Cancelled by DoseBox Admin';
        
        // Wait for the user to login and choose their refund method (Bank vs Tokens)
        // No auto-refunding happens here.
        order.refundStatus = 'Pending User Choice';
        order.refundMethod = 'None';
        
        // Send a generic cancellation email (the refund claim email will be sent later once they claim it)
        sendOrderStatusEmail(user, order, 'Cancelled (Please choose a refund option in your account)').catch(console.error);
      } else if (status) {
        // Logistics Integration
        if ((status === 'Packed' || status === 'Dispatched') && !order.trackingId && shippingAddress) {
          try {
            const logistics = getLogisticsProvider();
            
            // Map items for logistics
            const items = (order as any).items?.map((i: any) => ({
              name: i.medicine?.name || 'Medical Supplies',
              quantity: i.quantity,
              price: i.price
            })) || [];

            const shipmentRes = await logistics.createShipment({
              orderId: order.id,
              weightInKg: 0.5, // Default weight
              paymentMethod: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
              codAmount: order.paymentMethod === 'COD' ? Number(order.finalAmount) : 0,
              deliveryAddress: {
                name: user.name,
                phone: user.phone || '',
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zipCode: shippingAddress.zipCode,
                country: shippingAddress.country || 'India'
              },
              items
            });

            if (shipmentRes.success && shipmentRes.trackingId) {
              order.trackingId = shipmentRes.trackingId;
              order.shipmentId = shipmentRes.shipmentId;
              order.courierName = process.env.LOGISTICS_PROVIDER || 'Ekart Logistics';
              
              // Add tracking info to timeline
              let timeline = [];
              try { timeline = JSON.parse(order.trackingTimeline || '[]'); } catch(e){}
              timeline.push({
                status: 'Shipping Initiated',
                time: new Date().toISOString(),
                desc: `Courier: ${order.courierName} | AWB: ${order.trackingId}`
              });
              order.trackingTimeline = JSON.stringify(timeline);
            }
          } catch (logisticsErr) {
            console.error('Failed to create logistics shipment:', logisticsErr);
          }
        }

        // Send normal status update email
        sendOrderStatusEmail(user, order, status).catch(console.error);
      }

      await order.save();
      
      if (status || trackingMessage) {
        const title = 'Order Update';
        const msg = `Your order #OD-${order.id} has an update: ${status || order.status}`;
        
        await Notification.create({
          userId: order.userId,
          title,
          message: msg
        });

        if (user.fcmToken) {
          await sendPushNotification(user.fcmToken, title, msg, { orderId: String(order.id) });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully', data: order });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
