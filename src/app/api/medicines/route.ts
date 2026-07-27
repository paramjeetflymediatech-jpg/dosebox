export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Op, col } from 'sequelize';
import { Medicine, Category, Brand, Inventory, MedicineSection } from '../../../models';
import redisClient from '../../../config/redis';

async function clearMedicinesCache() {
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const prescription = searchParams.get('prescription');
    const sortBy = searchParams.get('sortBy');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const includeSections = searchParams.get('includeSections') === 'true';
    const contentStatus = searchParams.get('contentStatus');

    const cacheKey = `medicines:list:${searchParams.toString()}`;
    
    if (redisClient.isOpen) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return NextResponse.json({ success: true, fromCache: true, ...JSON.parse(cachedData) }, { status: 200 });
        }
      } catch (cacheErr) {
        console.warn('[Redis Cache Read Failed]', cacheErr);
      }
    }

    const whereClause: any = {};

    if (search) {
      let searchTerm = search;
      if (searchTerm.toLowerCase() === 'pcm') {
        searchTerm = 'paracetamol';
      }

      // Split by spaces to allow "Galvus 50mg" to match "Galvus" and "50mg"
      const searchTerms = searchTerm.split(' ').filter(t => t.trim().length > 0);
      
      const searchConditions = searchTerms.map(term => ({
        [Op.or]: [
          { name: { [Op.like]: `%${term}%` } },
          { genericName: { [Op.like]: `%${term}%` } },
          { composition: { [Op.like]: `%${term}%` } },
          { manufacturer: { [Op.like]: `%${term}%` } },
          { '$categoryDetail.name$': { [Op.like]: `%${term}%` } },
          { '$brand.name$': { [Op.like]: `%${term}%` } }
        ]
      }));

      whereClause[Op.and] = searchConditions;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    if (prescription !== null && prescription !== undefined) {
      whereClause.prescriptionRequired = prescription === 'true';
    }

    if (contentStatus) {
      whereClause.contentStatus = contentStatus;
    }

    const includeOptions: any[] = [
      { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] }
    ];

    if (category) {
      includeOptions.push({
        model: Category,
        as: 'categoryDetail',
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
      includeOptions[0].where = { slug: brand };
    }

    if (includeSections) {
      includeOptions.push({
        model: MedicineSection,
        as: 'sections',
        attributes: ['title', 'content']
      });
    }

    let order: any[] = [['id', 'DESC']];
    if (sortBy) {
      switch (sortBy) {
        case 'priceAsc': order = [['price', 'ASC']]; break;
        case 'priceDesc': order = [['price', 'DESC']]; break;
        case 'nameAsc': order = [['name', 'ASC']]; break;
        case 'nameDesc': order = [['name', 'DESC']]; break;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Medicine.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order,
      limit: limitNum,
      offset
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

    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(responsePayload));
      } catch (cacheErr) {}
    }

    return NextResponse.json({ success: true, fromCache: false, ...responsePayload }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Note: Admin authentication should be applied here (e.g. verifyAuth)
    const body = await req.json();
    const medicine = await Medicine.create(body);
    
    await Inventory.create({
      medicineId: medicine.id,
      minStockAlertThreshold: body.minStockAlertThreshold || 10,
      locationInWarehouse: body.locationInWarehouse || 'Unassigned'
    });

    if (body.sections && Array.isArray(body.sections)) {
      for (const section of body.sections) {
        await MedicineSection.create({
          medicineId: medicine.id,
          title: section.title,
          content: section.content,
          sortOrder: section.sortOrder
        });
      }
    }

    await clearMedicinesCache();

    return NextResponse.json({ success: true, message: 'Medicine created successfully', data: medicine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await Medicine.destroy({ where: {} });
    await clearMedicinesCache();
    return NextResponse.json({ success: true, message: 'All medicines deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
