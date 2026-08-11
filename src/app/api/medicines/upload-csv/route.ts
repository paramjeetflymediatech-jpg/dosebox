export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Medicine, Brand, Category, MedicineSection } from '../../../../models';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth instanceof NextResponse) return roleAuth;

    const formData = (await req.formData()) as any;
    const file = (formData as any).get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (!isExcel && !isCsv) {
      return NextResponse.json({ success: false, message: 'Only CSV and Excel (.xlsx/.xls) files are supported.' }, { status: 400 });
    }

    let rows: Record<string, string>[] = [];

    // --- Helper: extract category name from a "CATEGORY (...)" row ---
    const extractCategoryFromRow = (rowStr: string): string | null => {
      const lower = rowStr.toLowerCase();
      if (!lower.includes('category (by speciality)') && !lower.includes('category (by condition)')) return null;
      // Extract condition part: "BY (CONDITION) ANTI BACTERIALS"
      const condMatch = rowStr.match(/BY\s*\(CONDITION\)\s*(.+?)(?:$|\t|\r|\n)/i);
      const specMatch = rowStr.match(/CATEGORY\s*\(BY SPECIALITY\)\s*(.+?)(?:\/\/|$|\t|\r|\n)/i);
      if (condMatch) return condMatch[1].trim();
      if (specMatch) return specMatch[1].trim();
      return null;
    };

    // --- Helper: is this row a column-header row ---
    const isHeaderRow = (rowStr: string) => {
      const lower = rowStr.toLowerCase();
      return (
        lower.includes('brand name') ||
        lower.includes('generic name') ||
        lower.includes('composition') ||
        (lower.includes('name') && (lower.includes('price') || lower.includes('mrp') || lower.includes('stock') || lower.includes('hsn') || lower.includes('rate') || lower.includes('brand') || lower.includes('category')))
      );
    };

    if (isExcel) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      let currentHeaders: string[] = [];
      let currentCategory = 'General';

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.every(c => !String(c ?? '').trim())) continue;
        const rowStr = row.map(c => String(c ?? '')).join('\t');

        // Detect category context rows
        const detectedCat = extractCategoryFromRow(rowStr);
        if (detectedCat) { currentCategory = detectedCat; continue; }

        // Detect header rows (re-usable across sections)
        if (isHeaderRow(rowStr)) {
          currentHeaders = row.map(h => String(h).trim().toLowerCase());
          continue;
        }

        // If headers not set yet, set current row as headers
        if (currentHeaders.length === 0) {
          currentHeaders = row.map(h => String(h).trim().toLowerCase());
          continue;
        }

        const rowDataObj: Record<string, string> = { _category: currentCategory };
        currentHeaders.forEach((h, index) => {
          if (h) rowDataObj[h] = String(row[index] ?? '').trim();
        });

        // Ensure row has at least some data values
        const hasValues = Object.entries(rowDataObj).some(([k, v]) => k !== '_category' && v !== '');
        if (hasValues) {
          rows.push(rowDataObj);
        }
      }
    } else {
      // Parse CSV
      const text = await file.text();
      const lines = text.split(/\r?\n/);

      let currentHeaders: string[] = [];
      let currentCategory = 'General';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Detect category context rows
        const detectedCat = extractCategoryFromRow(line);
        if (detectedCat) { currentCategory = detectedCat; continue; }

        const splitLine = (l: string) => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        const cells = splitLine(line);
        if (cells.every(c => !c.trim())) continue;

        // Detect header rows
        if (isHeaderRow(line)) {
          currentHeaders = cells.map(h => h.toLowerCase());
          continue;
        }

        if (currentHeaders.length === 0) {
          currentHeaders = cells.map(h => h.toLowerCase());
          continue;
        }

        const rowData: Record<string, string> = { _category: currentCategory };
        currentHeaders.forEach((h, index) => { if (h) rowData[h] = cells[index] || ''; });

        const hasValues = Object.entries(rowData).some(([k, v]) => k !== '_category' && v !== '');
        if (hasValues) {
          rows.push(rowData);
        }
      }
    }

    // --- Header Mapping & Default Values ---
    rows = rows.map(row => {
      const normalizedRow: Record<string, string> = {};
      Object.entries(row).forEach(([k, v]) => {
        const lowerKey = k.trim().toLowerCase().replace(/^"|"$/g, '');
        let mappedKey = lowerKey;
        
        if (lowerKey === 'brand name' || lowerKey === 'medicine name' || lowerKey === 'product name') mappedKey = 'name';
        else if (lowerKey === 'composition/salt name' || lowerKey === 'generic name' || lowerKey === 'genericname' || lowerKey === 'composition' || lowerKey === 'salt name') mappedKey = 'genericname';
        else if (lowerKey === 'marketed by' || lowerKey === 'manufacturer' || lowerKey === 'brand') mappedKey = 'manufacturer';
        else if (lowerKey === 'dosebox rate' || lowerKey === 'discount price' || lowerKey === 'discountprice' || lowerKey === 'offer price') mappedKey = 'discountprice';
        else if (lowerKey === 'mrp' || lowerKey === 'price' || lowerKey === 'rate') mappedKey = 'price';
        else if (lowerKey === 'pack size' || lowerKey === 'packsize' || lowerKey === 'packaging') mappedKey = 'packsize';
        else if (lowerKey === 'storage requirement' || lowerKey === 'storageinstructions' || lowerKey === 'storage instructions' || lowerKey === 'storage') mappedKey = 'storageinstructions';
        else if (lowerKey === 'pap offer' || lowerKey === 'papoffer' || lowerKey === 'pap') mappedKey = 'papoffer';
        else if (lowerKey === 'hsn code' || lowerKey === 'hsn_code' || lowerKey === 'hsncode' || lowerKey === 'hsn code/sac' || lowerKey === 'hsn/sac' || lowerKey === 'hsn') mappedKey = 'hsncode';
        else if (lowerKey === 'prescription required' || lowerKey === 'prescriptionrequired' || lowerKey === 'rx required' || lowerKey === 'rx') mappedKey = 'prescriptionrequired';
        else if (lowerKey === 'category' || lowerKey === 'category name') mappedKey = 'category';
        
        normalizedRow[mappedKey] = v;
      });

      // Special case: copy genericname to composition if missing
      if (normalizedRow['genericname'] && !normalizedRow['composition']) {
        normalizedRow['composition'] = normalizedRow['genericname'];
      }
      if (normalizedRow['name'] && !normalizedRow['genericname']) {
        normalizedRow['genericname'] = normalizedRow['name'];
      }
      
      // Defaults for missing required fields in client format
      if (!normalizedRow['stock']) normalizedRow['stock'] = '100';
      return normalizedRow;
    });

    // --- Helper to slugify text ---
    const slugify = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general';

    // --- Pre-resolve Brand IDs (findOrCreate by manufacturer name) ---
    const brandCache: Record<string, number> = {};
    const getBrandId = async (manufacturerName: string): Promise<number> => {
      const key = manufacturerName.trim().toLowerCase();
      if (brandCache[key]) return brandCache[key];
      const name = manufacturerName.trim() || 'General';
      const slug = slugify(name);
      const [brand] = await (Brand as any).findOrCreate({ where: { slug }, defaults: { name, slug } });
      brandCache[key] = brand.id;
      return brand.id;
    };

    // --- Pre-resolve Category IDs (findOrCreate by category name) ---
    const categoryCache: Record<string, number> = {};
    const getCategoryId = async (categoryName: string): Promise<number> => {
      const key = categoryName.trim().toLowerCase();
      if (categoryCache[key]) return categoryCache[key];
      const name = categoryName.trim() || 'General';
      const slug = slugify(name);
      const [category] = await (Category as any).findOrCreate({ where: { slug }, defaults: { name, slug } });
      categoryCache[key] = category.id;
      return category.id;
    };

    // Validation: require name column
    if (rows.length > 0) {
      const firstRowKeys = Object.keys(rows[0]);
      if (!firstRowKeys.includes('name')) {
        return NextResponse.json({
          success: false,
          message: `File is missing required column: Name / BRAND NAME.`
        }, { status: 400 });
      }
    }

    let successCount = 0;
    let errorCount = 0;
    

    for (const rowData of rows) {
      if (!rowData.name) continue;
      try {
        let imagesArr = '[]';
        if (rowData.images) {
          imagesArr = rowData.images;
        } else if (rowData.image) {
          imagesArr = JSON.stringify([rowData.image]);
        }

        // Resolve brandId: prefer explicit column, else use manufacturer name
        let brandId: number;
        if (rowData.brandid && !isNaN(parseInt(rowData.brandid, 10))) {
          brandId = parseInt(rowData.brandid, 10);
        } else {
          const brandName = rowData.manufacturer || rowData.name.split(' ')[0] || 'General';
          brandId = await getBrandId(brandName);
        }

        // Resolve categoryId: prefer explicit column, then _category (from sheet header row), then 'General'
        let categoryId: number;
        if (rowData.categoryid && !isNaN(parseInt(rowData.categoryid, 10))) {
          categoryId = parseInt(rowData.categoryid, 10);
        } else {
          const catName = rowData._category || rowData.category || 'General';
          categoryId = await getCategoryId(catName);
        }

        const medicineData = {
          name: rowData.name,
          genericName: rowData.genericname || rowData.name,
          manufacturer: rowData.manufacturer || 'Unknown',
          composition: rowData.composition || rowData.genericname || 'Unknown',
          dosage: rowData.dosage || 'Unknown',
          description: rowData.description || undefined,
          sideEffects: rowData.sideeffects || undefined,
          storageInstructions: rowData.storageinstructions || undefined,
          papOffer: rowData.papoffer || undefined,
          packSize: rowData.packsize || undefined,
          price: parseFloat(rowData.price || '0'),
          discountPrice: rowData.discountprice ? parseFloat(rowData.discountprice) : undefined,
          stock: parseInt(rowData.stock || '100', 10),
          categoryId,
          brandId,
          supplierId: rowData.supplierid ? parseInt(rowData.supplierid, 10) : undefined,
          hsnCode: rowData.hsncode || rowData.hsn || undefined,
          images: imagesArr,
          prescriptionRequired: rowData.prescriptionrequired?.toLowerCase() === 'true',
          contentStatus: 'Draft'
        };

        const existingMed = await (Medicine as any).findOne({ where: { name: rowData.name } });
        let currentMedId;
        if (existingMed) {
          await existingMed.update(medicineData);
          currentMedId = existingMed.id;
        } else {
          const newMed = await (Medicine as any).create(medicineData);
          currentMedId = newMed.id;
        }

        // Process dynamic sections
        const sectionKeys = Object.keys(rowData).filter(k => k.startsWith('section: '));
        if (sectionKeys.length > 0 && currentMedId) {
          // Get existing sections for this medicine to manage sortOrder
          let existingSections = await (MedicineSection as any).findAll({ where: { medicineId: currentMedId } });
          let nextSortOrder = existingSections.length;

          for (const key of sectionKeys) {
            const title = key.replace('section: ', '').trim();
            const content = rowData[key];
            if (!content) continue;

            const existingSec = existingSections.find((s: any) => s.title.toLowerCase() === title.toLowerCase());
            if (existingSec) {
              await existingSec.update({ content });
            } else {
              await (MedicineSection as any).create({
                medicineId: currentMedId,
                title: title.charAt(0).toUpperCase() + title.slice(1),
                content,
                sortOrder: nextSortOrder++
              });
            }
          }
        }

        successCount++;
      } catch (err) {
        errorCount++;
        console.error('Row failed:', rowData.name, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `File Processed. ✅ Imported: ${successCount}, ❌ Failed: ${errorCount}`
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
