export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { 
  User, Medicine, Order, Prescription, Category, Brand, 
  Banner, Coupon, Blog, Doctor, Appointment, Faq, Supplier 
} from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const [
      users, medicines, orders, prescriptions, 
      categories, brands, banners, coupons, 
      blogs, doctors, appointments, faqs, suppliers
    ] = await Promise.all([
      User.count().catch(() => 0),
      Medicine.count().catch(() => 0),
      Order.count().catch(() => 0),
      Prescription.count().catch(() => 0),
      Category.count().catch(() => 0),
      Brand.count().catch(() => 0),
      Banner.count().catch(() => 0),
      Coupon.count().catch(() => 0),
      Blog.count().catch(() => 0),
      Doctor.count().catch(() => 0),
      Appointment.count().catch(() => 0),
      Faq.count().catch(() => 0),
      Supplier.count().catch(() => 0)
    ]);

    const data = {
      users,
      medicines,
      orders,
      prescriptions,
      categories,
      brands,
      banners,
      coupons,
      blogs,
      doctors,
      appointments,
      faqs,
      suppliers,
      rewards: 0,
      transactions: 0,
      seo: 0
    };

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
