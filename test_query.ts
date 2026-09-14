import { sequelize } from './src/config/database';
import { Category } from './src/models';

async function test() {
  await sequelize.authenticate();
  const allCategories = await Category.findAll();
  const activeCategories = await Category.findAll({ where: { isActive: true } });
  
  console.log('All categories:', allCategories.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
  console.log('Active categories:', activeCategories.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
  process.exit(0);
}
test();
