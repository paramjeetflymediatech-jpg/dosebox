import sequelize from './src/config/database';
import './src/models/index'; // Import models so they are registered with sequelize

async function forceSync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

forceSync();
