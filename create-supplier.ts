import sequelize from './src/config/database';
import { Supplier } from './src/models';

async function run() {
  try {
    await sequelize.sync();
    await Supplier.findOrCreate({
      where: { id: 1 },
      defaults: { name: 'HealthCorp Supplies', email: 'healthcorp@example.com', phone: '1234567890' }
    });
    await Supplier.findOrCreate({
      where: { id: 2 },
      defaults: { name: 'MedLife Distributors', email: 'medlife@example.com', phone: '0987654321' }
    });
    console.log('Suppliers 1 and 2 created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
