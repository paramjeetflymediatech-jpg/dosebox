import * as xlsx from 'xlsx';
import { Medicine, MedicineSection } from './src/models';
import sequelize from './src/config/database';

async function run() {
  await sequelize.authenticate();
  const workbook = xlsx.readFile('d:\\dosebox\\AI_Generated_Success.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any>(sheet);

  console.log(`Found ${data.length} rows in Excel.`);

  let matchCount = 0;
  let noMatchCount = 0;

  for (const row of data) {
    const medName = row['Brand Name']; // Contains medicine name
    if (!medName) continue;

    const med = await Medicine.findOne({ where: { name: medName } });
    if (!med) {
      noMatchCount++;
      continue;
    }

    // Delete existing sections to avoid duplicates
    await MedicineSection.destroy({ where: { medicineId: med.id } });

    // Collect all 'Section: ...' columns
    let sortOrder = 0;
    for (const key of Object.keys(row)) {
      if (key.startsWith('Section: ') && row[key]) {
        const title = key.replace('Section: ', '').trim();
        const content = row[key];

        // Ensure proper capitalization for title
        const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

        await MedicineSection.create({
          medicineId: med.id,
          title: formattedTitle,
          content: content,
          sortOrder: sortOrder++
        });
      }
    }

    // Also update the contentStatus so it appears as approved or ready
    med.contentStatus = 'Approved';
    await med.save();

    matchCount++;
  }

  console.log(`Successfully updated MedicineSections for ${matchCount} medicines.`);
  console.log(`${noMatchCount} medicines from the Excel file were not found in the database.`);
  process.exit(0);
}

run().catch(console.error);
