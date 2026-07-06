export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT, authorizeRoles } from '../../../../middleware/auth';
import { Medicine } from '../../../../models';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin');
    if (roleAuth instanceof NextResponse) return roleAuth;

    const formData = await req.formData();
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

    if (isExcel) {
      // Parse Excel using SheetJS
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      // Find header row dynamically (look for "brand name" or "name")
      let headerRowIndex = 0;
      for (let i = 0; i < rawData.length; i++) {
        const rowString = rawData[i].join(' ').toLowerCase();
        if (rowString.includes('brand name') || (rowString.includes('name') && rowString.includes('price'))) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = rawData[headerRowIndex].map(h => String(h).trim().toLowerCase());
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        // skip completely empty rows
        if (row.every(cell => !cell)) continue;
        const rowDataObj: Record<string, string> = {};
        headers.forEach((h, index) => {
          rowDataObj[h] = String(row[index] ?? '').trim();
        });
        rows.push(rowDataObj);
      }
    } else {
      // Parse CSV
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        return NextResponse.json({ success: false, message: 'Invalid CSV format or empty file' }, { status: 400 });
      }

      // Find header row dynamically
      let headerRowIndex = 0;
      for (let i = 0; i < lines.length; i++) {
         const lineLower = lines[i].toLowerCase();
         if (lineLower.includes('brand name') || (lineLower.includes('name') && lineLower.includes('price'))) {
            headerRowIndex = i;
            break;
         }
      }

      const headers = lines[headerRowIndex].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      rows = [];
      for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const currentLine = lines[i];
        if (!currentLine) continue;
        const row = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        const rowData: Record<string, string> = {};
        headers.forEach((h, index) => {
          rowData[h] = row[index] || '';
        });
        rows.push(rowData);
      }
    }

    // --- Header Mapping & Default Values ---
    rows = rows.map(row => {
      const normalizedRow: Record<string, string> = {};
      Object.entries(row).forEach(([k, v]) => {
        const lowerKey = k.trim().toLowerCase().replace(/^"|"$/g, '');
        let mappedKey = lowerKey;
        
        if (lowerKey === 'brand name') mappedKey = 'name';
        else if (lowerKey === 'composition/salt name') mappedKey = 'genericname';
        else if (lowerKey === 'marketed by') mappedKey = 'manufacturer';
        else if (lowerKey === 'dosebox rate') mappedKey = 'discountprice';
        else if (lowerKey === 'mrp') mappedKey = 'price';
        else if (lowerKey === 'pack size') mappedKey = 'dosage';
        else if (lowerKey === 'storage requirement') mappedKey = 'storageinstructions';
        else if (lowerKey === 'pap offer') mappedKey = 'papoffer';
        
        normalizedRow[mappedKey] = v;
      });

      // Special case: copy genericname to composition if missing
      if (normalizedRow['genericname'] && !normalizedRow['composition']) {
        normalizedRow['composition'] = normalizedRow['genericname'];
      }
      
      // Defaults for missing required fields in client format
      if (!normalizedRow['stock']) normalizedRow['stock'] = '100'; 
      if (!normalizedRow['categoryid']) normalizedRow['categoryid'] = '1'; 
      if (!normalizedRow['brandid']) normalizedRow['brandid'] = '1'; 
      
      return normalizedRow;
    });

    const expectedHeaders = ['name', 'genericname', 'price', 'stock', 'categoryid', 'brandid'];
    if (rows.length > 0) {
      const firstRowKeys = Object.keys(rows[0]);
      const isMissingHeaders = expectedHeaders.some(eh => !firstRowKeys.includes(eh));
      if (isMissingHeaders) {
        return NextResponse.json({
          success: false,
          message: `File is missing required columns. Expected: name (BRAND NAME), genericName (COMPOSITION/SALT NAME), price (MRP).`
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

        await Medicine.create({
          name: rowData.name,
          genericName: rowData.genericname,
          manufacturer: rowData.manufacturer || 'Unknown',
          composition: rowData.composition || 'Unknown',
          dosage: rowData.dosage || 'Unknown',
          description: rowData.description || undefined,
          sideEffects: rowData.sideeffects || undefined,
          storageInstructions: rowData.storageinstructions || undefined,
          price: parseFloat(rowData.price || '0'),
          discountPrice: rowData.discountprice ? parseFloat(rowData.discountprice) : undefined,
          stock: parseInt(rowData.stock || '0', 10),
          categoryId: parseInt(rowData.categoryid, 10),
          brandId: parseInt(rowData.brandid, 10),
          supplierId: rowData.supplierid ? parseInt(rowData.supplierid, 10) : undefined,
          images: imagesArr,
          prescriptionRequired: rowData.prescriptionrequired?.toLowerCase() === 'true'
        });
        successCount++;
      } catch (err) {
        errorCount++;
        console.error('Row failed:', rowData, err);
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
