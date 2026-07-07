export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Medicine, Category, Brand, Inventory, Review, User, MedicineSection } from '../../../../models';
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
        },
        { model: MedicineSection, as: 'sections' }
      ],
      order: [
        [{ model: MedicineSection, as: 'sections' }, 'sortOrder', 'ASC']
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

    if (body.sections && Array.isArray(body.sections)) {
      // Get existing sections
      const existingSections = await MedicineSection.findAll({ where: { medicineId: id } });
      const existingIds = existingSections.map(s => s.id);
      
      const updatedIds: number[] = [];
      
      for (const section of body.sections) {
        if (section.id && existingIds.includes(section.id)) {
          // Update existing
          await MedicineSection.update({
            title: section.title,
            content: section.content,
            sortOrder: section.sortOrder
          }, { where: { id: section.id } });
          updatedIds.push(section.id);
        } else {
          // Create new
          const newSec = await MedicineSection.create({
            medicineId: Number(id),
            title: section.title,
            content: section.content,
            sortOrder: section.sortOrder
          });
          updatedIds.push(newSec.id);
        }
      }
      
      // Delete removed sections
      const toDelete = existingIds.filter(id => !updatedIds.includes(id));
      if (toDelete.length > 0) {
        await MedicineSection.destroy({ where: { id: toDelete } });
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
