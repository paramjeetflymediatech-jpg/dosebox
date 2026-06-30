import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Op, col } from 'sequelize';
import { Order, User, Medicine, Prescription, Category, Inventory } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth) return roleAuth;

    const totalOrders = await Order.count();
    
    const orders = await Order.findAll({
      where: { paymentStatus: 'Paid' }
    });
    const totalRevenue = orders.reduce((acc: number, order: any) => acc + Number(order.finalAmount), 0);

    const totalCustomers = await User.count({ where: { roleId: 3 } });
    const activeUsers = await User.count({ where: { status: 'active' } });
    
    const prescriptionRequests = await Prescription.count({ where: { status: 'Pending' } });

    const inventoryAlerts = await Medicine.count({
      include: [{
        model: Inventory,
        as: 'inventory',
        where: { medicineId: { [Op.col]: 'Medicine.id' } }
      }],
      where: {
        stock: {
          [Op.lte]: col('inventory.minStockAlertThreshold')
        }
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      last6Months.push({ monthName: monthNames[d.getMonth()], year: d.getFullYear(), monthNum: d.getMonth() });
    }

    const revenueChart = last6Months.map(m => {
      const monthOrders = orders.filter((o: any) => {
        const od = new Date(o.createdAt);
        return od.getMonth() === m.monthNum && od.getFullYear() === m.year;
      });
      const revenue = monthOrders.reduce((acc: number, o: any) => acc + Number(o.finalAmount), 0);
      return { month: m.monthName, revenue, orders: monthOrders.length };
    });

    const allCustomers = await User.findAll({ where: { roleId: 3 } });
    const customerGrowthChart = last6Months.map(m => {
      const cumulativeCustomers = allCustomers.filter((u: any) => {
        const ud = new Date(u.createdAt);
        return (ud.getFullYear() < m.year) || (ud.getFullYear() === m.year && ud.getMonth() <= m.monthNum);
      });
      return { month: m.monthName, customers: cumulativeCustomers.length };
    });

    const topSellingMedicines = await Medicine.findAll({
      limit: 5,
      order: [['price', 'DESC']],
      attributes: ['id', 'name', 'manufacturer', 'price', 'stock']
    });

    const topCategories = await Category.findAll({
      limit: 3,
      attributes: ['id', 'name', 'slug']
    });

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRevenue, totalOrders, totalCustomers, activeUsers, prescriptionRequests, inventoryAlerts
        },
        charts: { revenueChart, customerGrowthChart },
        topSellingMedicines, topCategories
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
