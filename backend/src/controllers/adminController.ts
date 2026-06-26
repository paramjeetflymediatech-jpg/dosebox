import { Request, Response } from 'express';
import { Op, col } from 'sequelize';
import { 
  Order, User, Medicine, Prescription, Category, Coupon, Banner, Blog, Inventory, OrderItem 
} from '../models';

export class AdminController {
  
  /**
   * Get dashboard analytics stats and chart data
   */
  public static async getDashboardStats(req: Request, res: Response) {
    try {
      // 1. Core KPIs
      const totalOrders = await Order.count();
      
      const orders = await Order.findAll({
        where: { paymentStatus: 'Paid' }
      });
      const totalRevenue = orders.reduce((acc, order) => acc + Number(order.finalAmount), 0);

      const totalCustomers = await User.count({ where: { roleId: 3 } });
      const activeUsers = await User.count({ where: { status: 'active' } });
      
      const prescriptionRequests = await Prescription.count({ where: { status: 'Pending' } });

      // Inventory alerts count (stock <= threshold)
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

      // 2. Mock Chart Data (Monthly) for sales & customer growth
      const revenueChart = [
        { month: 'Jan', revenue: 45000, orders: 120 },
        { month: 'Feb', revenue: 52000, orders: 145 },
        { month: 'Mar', revenue: 61000, orders: 180 },
        { month: 'Apr', revenue: 58000, orders: 170 },
        { month: 'May', revenue: 75000, orders: 210 },
        { month: 'Jun', revenue: totalRevenue > 0 ? totalRevenue : 82000, orders: totalOrders > 0 ? totalOrders : 240 }
      ];

      const customerGrowthChart = [
        { month: 'Jan', customers: 450 },
        { month: 'Feb', customers: 620 },
        { month: 'Mar', customers: 850 },
        { month: 'Apr', customers: 1100 },
        { month: 'May', customers: 1350 },
        { month: 'Jun', customers: totalCustomers > 0 ? totalCustomers : 1600 }
      ];

      // 3. Top selling medicines
      const topSellingMedicines = await Medicine.findAll({
        limit: 5,
        order: [['price', 'DESC']], // Fallback sorting for display rank
        attributes: ['id', 'name', 'manufacturer', 'price', 'stock']
      });

      // 4. Top categories breakdown
      const topCategories = await Category.findAll({
        limit: 3,
        attributes: ['id', 'name', 'slug']
      });

      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            totalRevenue,
            totalOrders,
            totalCustomers,
            activeUsers,
            prescriptionRequests,
            inventoryAlerts
          },
          charts: {
            revenueChart,
            customerGrowthChart
          },
          topSellingMedicines,
          topCategories
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ----------------------------------------------------
  // User Management
  // ----------------------------------------------------
  public static async getUsers(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'phone', 'roleId', 'status', 'createdAt']
      });
      return res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'active' | 'inactive'

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      await user.update({ status });
      return res.status(200).json({ success: true, message: `User status changed to ${status}`, data: user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ----------------------------------------------------
  // Coupon Management
  // ----------------------------------------------------
  public static async getCoupons(req: Request, res: Response) {
    try {
      const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
      return res.status(200).json({ success: true, data: coupons });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createCoupon(req: Request, res: Response) {
    try {
      const coupon = await Coupon.create(req.body);
      return res.status(201).json({ success: true, message: 'Coupon added', data: coupon });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deleteCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
      await coupon.destroy();
      return res.status(200).json({ success: true, message: 'Coupon deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ----------------------------------------------------
  // Banner Management
  // ----------------------------------------------------
  public static async getBanners(req: Request, res: Response) {
    try {
      const banners = await Banner.findAll({ order: [['createdAt', 'DESC']] });
      return res.status(200).json({ success: true, data: banners });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createBanner(req: Request, res: Response) {
    try {
      const banner = await Banner.create(req.body);
      return res.status(201).json({ success: true, message: 'Banner added', data: banner });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deleteBanner(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      await banner.destroy();
      return res.status(200).json({ success: true, message: 'Banner deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ----------------------------------------------------
  // Blog Management
  // ----------------------------------------------------
  public static async getBlogs(req: Request, res: Response) {
    try {
      const blogs = await Blog.findAll({ order: [['createdAt', 'DESC']] });
      return res.status(200).json({ success: true, data: blogs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getBlogBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const blog = await Blog.findOne({ where: { slug } });
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Article not found' });
      }
      return res.status(200).json({ success: true, data: blog });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createBlog(req: Request, res: Response) {
    try {
      const blog = await Blog.create({
        ...req.body,
        authorId: 1 // default Admin
      });
      return res.status(201).json({ success: true, message: 'Article created', data: blog });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deleteBlog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Article not found' });
      }
      await blog.destroy();
      return res.status(200).json({ success: true, message: 'Article deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default AdminController;
