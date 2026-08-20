import * as xlsx from 'xlsx';
import { Medicine, MedicineSection } from './src/models';
import sequelize from './src/config/database';
import fs from 'fs';

async function run() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Error: Please provide the path to the Excel file.');
    console.log('Usage: npx tsx import-excel-medicines.ts <path_to_excel_file>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  console.log(`Connecting to database...`);
  await sequelize.authenticate();
  console.log(`Database connected successfully.`);

  console.log(`Reading Excel file: ${filePath}`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any>(sheet);

  console.log(`Found ${data.length} rows in the Excel file. Processing...`);

  let matchCount = 0;
  let noMatchCount = 0;

  for (const row of data) {
    const medName = row['Brand Name']; // Contains medicine name in the provided excel structure
    if (!medName) continue;

    const med = await Medicine.findOne({ where: { name: medName } });
    if (!med) {
      console.log(`[Skipped] Medicine not found in DB: ${medName}`);
      noMatchCount++;
      continue;
    }

    // 1. Delete existing sections to avoid duplicates
    await MedicineSection.destroy({ where: { medicineId: med.id } });

    // 2. Insert new sections
    let sortOrder = 0;
    for (const key of Object.keys(row)) {
      if (key.startsWith('Section: ') && row[key]) {
        const title = key.replace('Section: ', '').trim();
        const content = row[key];
        const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

        await MedicineSection.create({
          medicineId: med.id,
          title: formattedTitle,
          content: content,
          sortOrder: sortOrder++
        });
      }
    }

    // 3. Update the contentStatus to 'Approved'
    med.contentStatus = 'Approved';
    await med.save();

    matchCount++;
  }

  console.log(`\n--- Import Summary ---`);
  console.log(`Successfully updated and approved: ${matchCount} medicines.`);
  console.log(`Skipped (not found in DB): ${noMatchCount} medicines.`);
  
  process.exit(0);
}

run().catch((error) => {
  console.error('An error occurred during import:', error);
  process.exit(1);
});
