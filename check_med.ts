import { Medicine } from './src/models';
import sequelize from './src/config/database';

async function check() {
  await sequelize.authenticate();
  const med = await Medicine.findOne({ where: { id: 1 } });
  console.log(med?.toJSON());
  process.exit(0);
}

check().catch(console.error);
