import { Category, Medicine } from '../models';

/**
 * Automatically detects the proper categoryId for a medicine based on pharmaceutical composition & name
 * Matching the Master List categories:
 * - 4: Arthritis (Teriparatide, Bonmax, etc.)
 * - 5: Vaccines (HPV, DPT, Gardasil, Boostrix, etc.)
 * - 2: Anti Bacterials / Critical Care (Dalbavancin, Meropenem, Teicoplanin, etc.)
 * - 3: Anti Fungals / Critical Care (Posaconazole, etc.)
 * - 1: Oncology / Anti Cancer (Default chronic care oncology category)
 */
export function detectCategoryId(name: string, comp?: string | null, generic?: string | null): number {
  const text = `${name || ''} ${comp || ''} ${generic || ''}`.toLowerCase();

  // 1. Arthritis / Orthopaedics (Category ID 4)
  if (
    text.includes('teriparatide') || 
    text.includes('bonmax') || 
    text.includes('terifrac') || 
    text.includes('nu pth') ||
    text.includes('arthritis') ||
    text.includes('rheumatology')
  ) {
    return 4;
  }

  // 2. Vaccines (Category ID 5)
  if (
    text.includes('vaccine') || 
    text.includes('gardasil') || 
    text.includes('cervavac') || 
    text.includes('boostrix') || 
    text.includes('hexaxim') || 
    text.includes('hpv') || 
    text.includes('dpt') ||
    text.includes('pertussis') ||
    text.includes('tetanus')
  ) {
    return 5;
  }

  // 3. Anti Bacterials / Critical Care (Category ID 2)
  if (
    text.includes('dalbavancin') || 
    text.includes('meropenem') || 
    text.includes('sulbactam') || 
    text.includes('teicoplanin') || 
    text.includes('dalbavan') || 
    text.includes('dalbonova') || 
    text.includes('merowemb') || 
    text.includes('tecowem')
  ) {
    return 2;
  }

  // 4. Anti Fungals / Critical Care (Category ID 3)
  if (
    text.includes('posaconazole') || 
    text.includes('antifungal')
  ) {
    return 3;
  }

  // 5. Default to Oncology (Category ID 1)
  return 1;
}

/**
 * When any medicine is activated or created, automatically ensure its category is marked active
 */
export async function ensureCategoryActiveForMedicine(categoryId?: number | null) {
  if (!categoryId) return;
  try {
    await Category.update({ isActive: true }, { where: { id: categoryId } });
  } catch (err) {
    console.error('Failed to auto-activate category for medicine:', err);
  }
}
