export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { Medicine, Brand, Category } from '../../../../../models';

// Clean molecule name by stripping pharmacopeia indicators & strength tokens
export function cleanMolecule(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/\b(ip|bp|usp|i\.p\.|b\.p\.|u\.s\.p\.)\b/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|iu|ml|%|ug)(?:\s*(?:\/|w\/v|w\/w)\s*\d*(?:\.\d+)?\s*(?:ml|mg|g)?)?\b/gi, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Utility to extract normalized strength (e.g. "250mg", "500mg", "10ml", "1%w/v")
export function extractStrength(name: string, comp?: string | null, dosage?: string | null): string | null {
  const text = `${name || ''} ${comp || ''} ${dosage || ''}`;
  const match = text.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|iu|ml|%|ug)(?:\s*(?:\/|w\/v|w\/w)\s*\d*(?:\.\d+)?\s*(?:ml|mg|g)?)?)/i);
  if (!match) return null;
  return match[1].toLowerCase().replace(/\s+/g, '');
}

// Utility to extract dosage form (e.g. "tablet", "injection", "syrup")
export function extractDosageForm(name: string, comp?: string | null, dosage?: string | null): string | null {
  const text = `${name || ''} ${comp || ''} ${dosage || ''}`.toLowerCase();
  const forms = [
    'injection', 'tablet', 'capsule', 'syrup', 'suspension',
    'drops', 'ointment', 'cream', 'gel', 'lotion', 'inhaler',
    'solution', 'infusion', 'spray', 'powder'
  ];
  for (const form of forms) {
    if (text.includes(form)) {
      return form;
    }
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const medicineId = parseInt(id, 10);

    if (isNaN(medicineId)) {
      return NextResponse.json({ success: false, message: 'Invalid medicine ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '8', 10));
    const strictForm = searchParams.get('strictForm') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 1. Fetch Target Medicine
    const target = await Medicine.findByPk(medicineId, {
      include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryDetail', attributes: ['id', 'name'] }
      ]
    });

    if (!target) {
      return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }

    const rawGeneric = (target.genericName || '').trim();
    const rawComp = (target.composition || '').trim();
    const cleanGeneric = cleanMolecule(rawGeneric) || cleanMolecule(rawComp);
    const targetStrength = extractStrength(target.name, target.composition, target.dosage);
    const targetForm = extractDosageForm(target.name, target.composition, target.dosage);

    const targetPrice = Number(target.price);
    const targetDiscPrice = target.discountPrice ? Number(target.discountPrice) : null;
    const targetEffPrice = targetDiscPrice !== null && targetDiscPrice > 0 ? targetDiscPrice : targetPrice;

    // 2. Query Candidate Substitutes by Molecule
    const moleculeConditions: any[] = [];
    if (cleanGeneric && cleanGeneric.length >= 3) {
      moleculeConditions.push({ genericName: { [Op.like]: `%${cleanGeneric}%` } });
      moleculeConditions.push({ composition: { [Op.like]: `%${cleanGeneric}%` } });
      moleculeConditions.push({ name: { [Op.like]: `%${cleanGeneric}%` } });
    }
    if (rawGeneric && rawGeneric !== cleanGeneric && rawGeneric.length >= 3) {
      moleculeConditions.push({ genericName: { [Op.like]: `%${rawGeneric}%` } });
    }

    if (moleculeConditions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          targetMedicine: {
            id: target.id,
            name: target.name,
            genericName: target.genericName,
            composition: target.composition,
            strength: targetStrength,
            dosageForm: targetForm,
            price: targetPrice,
            discountPrice: targetDiscPrice,
            effectivePrice: targetEffPrice
          },
          substitutes: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: page, pageSize: limit }
        }
      });
    }

    const candidateWhere: any = {
      id: { [Op.ne]: target.id },
      [Op.or]: moleculeConditions
    };

    if (!includeInactive) {
      candidateWhere[Op.and] = [
        {
          [Op.or]: [
            { isActive: true },
            { contentStatus: 'Approved' }
          ]
        }
      ];
    }

    const candidates = await Medicine.findAll({
      where: candidateWhere,
      include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryDetail', attributes: ['id', 'name'] }
      ]
    });

    // 3. Filter candidates strictly by Strength
    let filtered = candidates.filter((item) => {
      // If target has a defined strength (e.g. 250mg), the substitute MUST match the exact same strength
      if (targetStrength) {
        const itemStrength = extractStrength(item.name, item.composition, item.dosage);
        if (!itemStrength || itemStrength !== targetStrength) {
          return false;
        }
      }

      // If strictForm is enabled and target has a known form (e.g. injection, tablet), match dosage form
      if (strictForm && targetForm) {
        const itemForm = extractDosageForm(item.name, item.composition, item.dosage);
        if (itemForm && itemForm !== targetForm) {
          return false;
        }
      }

      return true;
    });

    // Prioritize same dosage form if available
    if (targetForm && !strictForm) {
      filtered.sort((a, b) => {
        const formA = extractDosageForm(a.name, a.composition, a.dosage) === targetForm ? 0 : 1;
        const formB = extractDosageForm(b.name, b.composition, b.dosage) === targetForm ? 0 : 1;
        if (formA !== formB) return formA - formB;

        const priceA = a.discountPrice ? Number(a.discountPrice) : Number(a.price);
        const priceB = b.discountPrice ? Number(b.discountPrice) : Number(b.price);
        return priceA - priceB;
      });
    } else {
      // 4. Sort substitute products in ascending order of price (lowest to highest)
      filtered.sort((a, b) => {
        const priceA = a.discountPrice ? Number(a.discountPrice) : Number(a.price);
        const priceB = b.discountPrice ? Number(b.discountPrice) : Number(b.price);
        return priceA - priceB;
      });
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedItems = filtered.slice(offset, offset + limit);

    // 5. Calculate Price Comparison & Savings
    const substitutesWithComparison = paginatedItems.map((item) => {
      const price = Number(item.price);
      const discPrice = item.discountPrice ? Number(item.discountPrice) : null;
      const subEffPrice = discPrice !== null && discPrice > 0 ? discPrice : price;

      // Difference compared with selected medicine:
      // positive = substitute is cheaper (savings!)
      // negative = substitute is more expensive
      const diff = Number((targetEffPrice - subEffPrice).toFixed(2));
      const absDiff = Math.abs(diff);
      const percentage = targetEffPrice > 0 ? Math.round((absDiff / targetEffPrice) * 100) : 0;

      const isCheaper = diff > 0.01;
      const isExpensive = diff < -0.01;
      const isSamePrice = !isCheaper && !isExpensive;

      let savingsText = 'Same price';
      let badgeColor: 'green' | 'red' | 'gray' = 'gray';

      if (isCheaper) {
        savingsText = `Save ₹${absDiff.toFixed(2)} (${percentage}% cheaper)`;
        badgeColor = 'green';
      } else if (isExpensive) {
        savingsText = `+₹${absDiff.toFixed(2)} (${percentage}% more expensive)`;
        badgeColor = 'red';
      }

      const itemStrength = extractStrength(item.name, item.composition, item.dosage);
      const itemForm = extractDosageForm(item.name, item.composition, item.dosage);

      return {
        id: item.id,
        name: item.name,
        genericName: item.genericName,
        composition: item.composition,
        manufacturer: item.manufacturer,
        dosage: item.dosage,
        packSize: item.packSize,
        strength: itemStrength || targetStrength,
        dosageForm: itemForm || targetForm,
        prescriptionRequired: item.prescriptionRequired,
        price,
        discountPrice: discPrice,
        effectivePrice: subEffPrice,
        stock: item.stock,
        images: item.images,
        brand: (item as any).brand,
        categoryDetail: (item as any).categoryDetail,
        comparison: {
          diff,
          absDiff,
          percentage,
          isCheaper,
          isExpensive,
          isSamePrice,
          savingsText,
          badgeColor
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        targetMedicine: {
          id: target.id,
          name: target.name,
          genericName: target.genericName,
          composition: target.composition,
          strength: targetStrength,
          dosageForm: targetForm,
          price: targetPrice,
          discountPrice: targetDiscPrice,
          effectivePrice: targetEffPrice
        },
        substitutes: substitutesWithComparison,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching medicine substitutes:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
