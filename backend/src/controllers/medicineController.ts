import { Request, Response } from 'express';
import { Op, col } from 'sequelize';
import { Medicine, Category, Brand, Inventory, Review, User } from '../models';
import redisClient from '../config/redis';

export class MedicineController {
  
  /**
   * Get filtered, paginated medicines with Redis caching
   */
  public static async getMedicines(req: Request, res: Response) {
    try {
      const {
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        prescription,
        sortBy,
        page = '1',
        limit = '10'
      } = req.query;

      // Create a unique Redis key based on query params
      const cacheKey = `medicines:list:${JSON.stringify(req.query)}`;
      
      // Attempt to read from Redis Cache
      if (redisClient.isOpen) {
        try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            console.log('[Redis] Cache hit for query:', cacheKey);
            return res.status(200).json({ success: true, fromCache: true, ...JSON.parse(cachedData) });
          }
        } catch (cacheErr) {
          console.warn('[Redis Cache Read Failed]', cacheErr);
        }
      }

      // Build database query
      const whereClause: any = {};

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { genericName: { [Op.like]: `%${search}%` } },
          { composition: { [Op.like]: `%${search}%` } },
          { manufacturer: { [Op.like]: `%${search}%` } }
        ];
      }

      if (minPrice || maxPrice) {
        whereClause.price = {};
        if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice as string);
        if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice as string);
      }

      if (prescription !== undefined) {
        whereClause.prescriptionRequired = prescription === 'true';
      }

      // Include structures
      const includeOptions: any[] = [
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] }
      ];

      if (category) {
        includeOptions.push({
          model: Category,
          as: 'categoryDetail', // matches association
          where: { slug: category },
          attributes: ['id', 'name', 'slug']
        });
      } else {
        includeOptions.push({
          model: Category,
          as: 'categoryDetail',
          attributes: ['id', 'name', 'slug']
        });
      }

      if (brand && !whereClause.brandId) {
        // If brand slug is given, we need to filter by Brand Slug
        includeOptions[0].where = { slug: brand };
      }

      // Sort Order
      let order: any[] = [['id', 'DESC']];
      if (sortBy) {
        switch (sortBy) {
          case 'priceAsc':
            order = [['price', 'ASC']];
            break;
          case 'priceDesc':
            order = [['price', 'DESC']];
            break;
          case 'nameAsc':
            order = [['name', 'ASC']];
            break;
          case 'nameDesc':
            order = [['name', 'DESC']];
            break;
        }
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await Medicine.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        order,
        limit: limitNum,
        offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / limitNum);

      const responsePayload = {
        data: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: pageNum,
          pageSize: limitNum
        }
      };

      // Store in Redis if client is open (expire in 5 minutes)
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, 300, JSON.stringify(responsePayload));
        } catch (cacheErr) {
          console.warn('[Redis Cache Write Failed]', cacheErr);
        }
      }

      return res.status(200).json({ success: true, fromCache: false, ...responsePayload });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get single medicine details with reviews
   */
  public static async getMedicineById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const medicine = await Medicine.findByPk(id, {
        include: [
          { model: Category, as: 'categoryDetail' },
          { model: Brand, as: 'brand' },
          { model: Inventory, as: 'inventory' },
          { 
            model: Review, 
            as: 'reviews',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
          }
        ]
      });

      if (!medicine) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      return res.status(200).json({ success: true, data: medicine });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * List all categories
   */
  public static async getCategories(req: Request, res: Response) {
    try {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      return res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * List all brands
   */
  public static async getBrands(req: Request, res: Response) {
    try {
      const brands = await Brand.findAll({ order: [['name', 'ASC']] });
      return res.status(200).json({ success: true, data: brands });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Create new medicine (Admin only)
   */
  public static async createMedicine(req: Request, res: Response) {
    try {
      const medicine = await Medicine.create(req.body);
      
      // Auto create inventory mapping
      await Inventory.create({
        medicineId: medicine.id,
        minStockAlertThreshold: req.body.minStockAlertThreshold || 10,
        locationInWarehouse: req.body.locationInWarehouse || 'Unassigned'
      });

      // Clear cache
      await MedicineController.clearMedicinesCache();

      return res.status(201).json({ success: true, message: 'Medicine created successfully', data: medicine });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update medicine details (Admin only)
   */
  public static async updateMedicine(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const medicine = await Medicine.findByPk(id);

      if (!medicine) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      await medicine.update(req.body);

      if (req.body.minStockAlertThreshold || req.body.locationInWarehouse) {
        const inv = await Inventory.findOne({ where: { medicineId: id } });
        if (inv) {
          await inv.update({
            minStockAlertThreshold: req.body.minStockAlertThreshold ?? inv.minStockAlertThreshold,
            locationInWarehouse: req.body.locationInWarehouse ?? inv.locationInWarehouse
          });
        }
      }

      // Clear cache
      await MedicineController.clearMedicinesCache();

      return res.status(200).json({ success: true, message: 'Medicine updated successfully', data: medicine });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete medicine (Admin only)
   */
  public static async deleteMedicine(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const medicine = await Medicine.findByPk(id);

      if (!medicine) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      await medicine.destroy();
      
      // Clear cache
      await MedicineController.clearMedicinesCache();

      return res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get medicines with stock below warning limit (Admin only)
   */
  public static async getInventoryAlerts(req: Request, res: Response) {
    try {
      const alerts = await Medicine.findAll({
        include: [{
          model: Inventory,
          as: 'inventory',
          where: {
            medicineId: { [Op.col]: 'Medicine.id' }
          }
        }],
        where: {
          stock: {
            [Op.lte]: col('inventory.minStockAlertThreshold')
          }
        }
      });

      return res.status(200).json({ success: true, data: alerts });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Helper to clear Redis list caches
   */
  private static async clearMedicinesCache() {
    if (redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('medicines:list:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log('[Redis] Cleared medicines list caches:', keys.length);
        }
      } catch (cacheErr) {
        console.warn('[Redis Cache Clear Failed]', cacheErr);
      }
    }
  }
}

export default MedicineController;
