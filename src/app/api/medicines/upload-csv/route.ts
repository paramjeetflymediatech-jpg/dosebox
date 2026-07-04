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
    const file = formData.get('file') as File;

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
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      rows = json.map(row => {
        const normalized: Record<string, string> = {};
        Object.entries(row).forEach(([k, v]) => {
          normalized[k.trim().toLowerCase()] = String(v ?? '').trim();
        });
        return normalized;
      });
    } else {
      // Parse CSV
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        return NextResponse.json({ success: false, message: 'Invalid CSV format or empty file' }, { status: 400 });
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      rows = [];
      for (let i = 1; i < lines.length; i++) {
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

    const expectedHeaders = ['name', 'genericname', 'price', 'stock', 'categoryid', 'brandid'];
    if (rows.length > 0) {
      const firstRowKeys = Object.keys(rows[0]);
      const isMissingHeaders = expectedHeaders.some(eh => !firstRowKeys.includes(eh));
      if (isMissingHeaders) {
        return NextResponse.json({
          success: false,
          message: 'File is missing required columns. Expected: name, genericName, price, stock, categoryId, brandId, [supplierId], [images]'
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
          minStockAlertThreshold: parseInt(rowData.minstockalertthreshold || '10', 10),
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
