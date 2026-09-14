import { Category, Medicine } from './src/models';
import { sequelize } from './src/config/database';

async function syncCategories() {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    const categories = await Category.findAll();
    let updatedCount = 0;

    for (const category of categories) {
      const activeMedicinesCount = await Medicine.count({
        where: {
          categoryId: category.id,
          isActive: true
        }
      });

      const shouldBeActive = activeMedicinesCount > 0;

      if (category.isActive !== shouldBeActive) {
        await category.update({ isActive: shouldBeActive });
        console.log(`Updated Category "${category.name}" to isActive=${shouldBeActive} (Active Medicines: ${activeMedicinesCount})`);
        updatedCount++;
      }
    }

    console.log(`Successfully synced categories. Total categories updated: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing categories:', error);
    process.exit(1);
  }
}

syncCategories();
