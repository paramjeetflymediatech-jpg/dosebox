import dotenv from 'dotenv';
dotenv.config();
import sequelize from './config/database';
import db from './models';

async function test() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced with alter: true');
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
test();

