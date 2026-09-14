import { sequelize } from './src/config/database';
import './src/models/index';

async function syncDb() {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');
    await sequelize.sync({ alter: true });
    console.log('Database synced!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing DB:', error);
    process.exit(1);
  }
}

syncDb();
