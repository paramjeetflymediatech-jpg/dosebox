import * as xlsx from 'xlsx';
import { Medicine, Brand } from './src/models';
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

  for (let i = 0; i < 5; i++) {
    const row = data[i];
    const medName = row['Name of the Medicine'];
    const brandName = row['Brand Name'];

    const brand = await Brand.findOne({ where: { name: brandName } });
    if (!brand) {
      console.log(`[Row ${i}] Brand not found: ${brandName}`);
      noMatchCount++;
      continue;
    }

    const med = await Medicine.findOne({ where: { name: medName, brandId: brand.id } });
    if (!med) {
      console.log(`[Row ${i}] Medicine not found: ${medName} (Brand: ${brandName})`);
      noMatchCount++;
      continue;
    }

    matchCount++;
    console.log(`[Row ${i}] MATCHED! Medicine: ${medName} (Brand: ${brandName})`);
    
    // Example of what description would look like
    let fullDescription = '';
    for (const key of Object.keys(row)) {
        if (key.startsWith('Section: ')) {
            fullDescription += `<h3>${key.replace('Section: ', '')}</h3>\n${row[key]}\n\n`;
        }
    }
    console.log(`  -> Would update description (length: ${fullDescription.length} chars)`);
  }

  process.exit(0);
}

run().catch(console.error);
