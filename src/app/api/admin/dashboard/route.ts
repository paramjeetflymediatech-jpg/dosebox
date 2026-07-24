export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Op, col } from 'sequelize';
import { Order, User, Medicine, Category, Inventory, Prescription } from '../../../../models';

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership', 'Medico');
    if (roleAuth) return roleAuth;

    const totalOrders = await Order.count();
    
    const allOrders = await Order.findAll();
    const paidOrders = allOrders.filter((o: any) => o.paymentStatus === 'Paid');
    const totalRevenue = paidOrders.reduce((acc: number, order: any) => acc + Number(order.finalAmount), 0);

    const totalCustomers = await User.count({ where: { roleId: 2 } });
    const activeUsers = await User.count({ where: { status: 'active' } });
    const totalTokensResult = await User.sum('doseboxTokens');
    const totalTokens = totalTokensResult || 0;
    
    const prescriptionRequests = 0;

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
      const monthOrders = paidOrders.filter((o: any) => {
        const od = new Date(o.createdAt);
        return od.getMonth() === m.monthNum && od.getFullYear() === m.year;
      });
      const revenue = monthOrders.reduce((acc: number, o: any) => acc + Number(o.finalAmount), 0);
      return { month: m.monthName, revenue, orders: monthOrders.length };
    });

    const allCustomers = await User.findAll({ where: { roleId: 2 } });
    const customerGrowthChart = last6Months.map(m => {
      const cumulativeCustomers = allCustomers.filter((u: any) => {
        const ud = new Date(u.createdAt);
        return (ud.getFullYear() < m.year) || (ud.getFullYear() === m.year && ud.getMonth() <= m.monthNum);
      });
      return { month: m.monthName, customers: cumulativeCustomers.length };
    });

    const orderStatusCounts: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      const status = o.status || 'Unknown';
      orderStatusCounts[status] = (orderStatusCounts[status] || 0) + 1;
    });

    const orderHealthChart = Object.entries(orderStatusCounts).map(([name, value]) => ({
      name,
      value
    }));

    if (inventoryAlerts > 0) {
      orderHealthChart.push({ name: 'Stock Issues', value: inventoryAlerts });
    }

    const topSellingMedicines = await Medicine.findAll({
      limit: 5,
      order: [['price', 'DESC']],
      attributes: ['id', 'name', 'manufacturer', 'price', 'stock']
    });

    const topCategories = await Category.findAll({
      limit: 3,
      attributes: ['id', 'name', 'slug']
    });

    // --- MEDICO STATS ---
    const allPrescriptions = await Prescription.findAll({ attributes: ['status'] });
    const prescriptionStatusCounts: Record<string, number> = {};
    allPrescriptions.forEach((p: any) => {
      const s = p.status || 'Unknown';
      prescriptionStatusCounts[s] = (prescriptionStatusCounts[s] || 0) + 1;
    });

    const allMedicines = await Medicine.findAll({ attributes: ['contentStatus'] });
    const contentStatusCounts: Record<string, number> = {};
    allMedicines.forEach((m: any) => {
      const s = m.contentStatus || 'Draft';
      contentStatusCounts[s] = (contentStatusCounts[s] || 0) + 1;
    });

    const medicoStats = {
      prescriptionChart: Object.entries(prescriptionStatusCounts).map(([name, value]) => ({ name, value })),
      catalogChart: Object.entries(contentStatusCounts).map(([name, value]) => ({ name, value })),
      totalPrescriptions: allPrescriptions.length,
      pendingPrescriptions: prescriptionStatusCounts['Pending'] || 0,
      draftMedicines: contentStatusCounts['Draft'] || 0,
      reviewMedicines: contentStatusCounts['Review'] || 0,
      lowStockMedicines: inventoryAlerts
    };

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          activeUsers,
          totalTokens,
          prescriptionRequests,
          inventoryAlerts
        },
        charts: { revenueChart, customerGrowthChart, orderHealthChart },
        topSellingMedicines, topCategories, medicoStats
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
