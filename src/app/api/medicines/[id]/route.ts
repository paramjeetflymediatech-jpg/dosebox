import { NextRequest, NextResponse } from 'next/server';
import { Medicine, Category, Brand, Inventory, Review, User } from '../../../../models';
import redisClient from '../../../../config/redis';

async function clearMedicinesCache() {
  if (redisClient.isOpen) {
    try {
      const keys = await redisClient.keys('medicines:list:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (cacheErr) {}
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
      return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: medicine }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const medicine = await Medicine.findByPk(id);

    if (!medicine) {
      return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }

    await medicine.update(body);

    if (body.minStockAlertThreshold || body.locationInWarehouse) {
      const inv = await Inventory.findOne({ where: { medicineId: id } });
      if (inv) {
        await inv.update({
          minStockAlertThreshold: body.minStockAlertThreshold ?? inv.minStockAlertThreshold,
          locationInWarehouse: body.locationInWarehouse ?? inv.locationInWarehouse
        });
      }
    }

    await clearMedicinesCache();

    return NextResponse.json({ success: true, message: 'Medicine updated successfully', data: medicine }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const medicine = await Medicine.findByPk(id);

    if (!medicine) {
      return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }

    await medicine.destroy();
    
    await clearMedicinesCache();

    return NextResponse.json({ success: true, message: 'Medicine deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
