import sequelize from './src/config/database';
import * as models from './src/models';

async function syncDB() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Syncing models with alter: true...');
    // This will create tables if they don't exist and alter them if they do
    // It compares current models in src/models to the database schema
    await sequelize.sync({ alter: true });
    
    console.log('Database sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing database:', err);
    process.exit(1);
  }
}

syncDB();
