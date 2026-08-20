import * as xlsx from 'xlsx';
import { Medicine } from './src/models';
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
    const medName = row['Brand Name']; // Actually holds the medicine name in this Excel
    const introduction = row['Section: Introduction'];
    const uses = row['Section: Uses'];
    
    // Fallback to Introduction + Uses if there's no single "General descriptions" column
    const generalDescription = introduction ? `${introduction}\n\n${uses || ''}` : '';

    if (!medName || !generalDescription) {
        continue;
    }

    // @ts-ignore
    const med = await Medicine.findOne({ where: { name: medName } });
    if (!med) {
      console.log(`Medicine not found: ${medName}`);
      noMatchCount++;
      continue;
    }

    med.description = generalDescription;
    await med.save();
    
    matchCount++;
  }

  console.log(`Successfully updated descriptions for ${matchCount} medicines.`);
  console.log(`${noMatchCount} medicines from the Excel file were not found in the database.`);
  process.exit(0);
}

run().catch(console.error);
