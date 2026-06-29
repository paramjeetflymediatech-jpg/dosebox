import { Request, Response } from 'express';
import { Op, col } from 'sequelize';
import { 
  Order, User, Medicine, Prescription, Category, Coupon, Banner, Blog, Inventory, OrderItem, Setting, PageMeta
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

      // 2. Dynamic Chart Data (Monthly) for sales & customer growth
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        last6Months.push({ monthName: monthNames[d.getMonth()], year: d.getFullYear(), monthNum: d.getMonth() });
      }

      // Aggregate Revenue & Orders
      const revenueChart = last6Months.map(m => {
        const monthOrders = orders.filter(o => {
          const od = new Date((o as any).createdAt);
          return od.getMonth() === m.monthNum && od.getFullYear() === m.year;
        });
        const revenue = monthOrders.reduce((acc, o) => acc + Number(o.finalAmount), 0);
        return { month: m.monthName, revenue, orders: monthOrders.length };
      });

      // Aggregate Customers (Cumulative Growth)
      const allCustomers = await User.findAll({ where: { roleId: 3 } });
      const customerGrowthChart = last6Months.map(m => {
        const cumulativeCustomers = allCustomers.filter(u => {
          const ud = new Date((u as any).createdAt);
          return (ud.getFullYear() < m.year) || (ud.getFullYear() === m.year && ud.getMonth() <= m.monthNum);
        });
        return { month: m.monthName, customers: cumulativeCustomers.length };
      });

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
  // File Upload
  // ----------------------------------------------------
  public static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a file' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.status(200).json({ success: true, fileUrl, message: 'File uploaded successfully' });
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

  public static async getCouponById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
      return res.status(200).json({ success: true, data: coupon });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
      await coupon.update(req.body);
      return res.status(200).json({ success: true, message: 'Coupon updated', data: coupon });
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

  public static async getBannerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      return res.status(200).json({ success: true, data: banner });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateBanner(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      await banner.update(req.body);
      return res.status(200).json({ success: true, message: 'Banner updated', data: banner });
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

  public static async getBlogById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Article not found' });
      }
      return res.status(200).json({ success: true, data: blog });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateBlog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Article not found' });
      }
      await blog.update(req.body);
      return res.status(200).json({ success: true, message: 'Article updated', data: blog });
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

  // ----------------------------------------------------
  // Global Settings (SEO) Management
  // ----------------------------------------------------
  public static async getSettings(req: Request, res: Response) {
    try {
      const settings = await Setting.findAll();
      return res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateSettings(req: Request, res: Response) {
    try {
      const settingsToUpdate = req.body.settings; // array of { key, value }
      if (!Array.isArray(settingsToUpdate)) {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
      }

      for (const item of settingsToUpdate) {
        const { key, value } = item;
        const [setting, created] = await Setting.findOrCreate({
          where: { key },
          defaults: { key, value }
        });
        if (!created) {
          setting.value = value;
          await setting.save();
        }
      }
      return res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ----------------------------------------------------
  // PageMeta (SEO) Management
  // ----------------------------------------------------
  public static async getPageMeta(req: Request, res: Response) {
    try {
      const pageMeta = await PageMeta.findAll();
      return res.status(200).json({ success: true, data: pageMeta });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createPageMeta(req: Request, res: Response) {
    try {
      const pageMeta = await PageMeta.create(req.body);
      return res.status(201).json({ success: true, message: 'Page meta added', data: pageMeta });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getPageMetaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pageMeta = await PageMeta.findByPk(id);
      if (!pageMeta) {
        return res.status(404).json({ success: false, message: 'Page meta not found' });
      }
      return res.status(200).json({ success: true, data: pageMeta });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updatePageMeta(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pageMeta = await PageMeta.findByPk(id);
      if (!pageMeta) {
        return res.status(404).json({ success: false, message: 'Page meta not found' });
      }
      await pageMeta.update(req.body);
      return res.status(200).json({ success: true, message: 'Page meta updated', data: pageMeta });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deletePageMeta(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pageMeta = await PageMeta.findByPk(id);
      if (!pageMeta) {
        return res.status(404).json({ success: false, message: 'Page meta not found' });
      }
      await pageMeta.destroy();
      return res.status(200).json({ success: true, message: 'Page meta deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default AdminController;
