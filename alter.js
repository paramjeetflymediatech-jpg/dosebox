require('dotenv').config();
const mysql = require('mysql2/promise');

async function alterTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'mrmed_db'
  });
  
  try {
    await connection.execute('ALTER TABLE `orders` ADD COLUMN `courierName` VARCHAR(255) NULL;');
    console.log('Successfully added courierName column');
  } catch (err) {
    console.log('courierName column already exists or error:', err.message);
  }
  
  try {
    await connection.execute('ALTER TABLE `orders` ADD COLUMN `trackingId` VARCHAR(255) NULL;');
    console.log('Successfully added trackingId column');
  } catch (err) {
    console.log('trackingId column already exists or error:', err.message);
  }

  try {
    await connection.execute('ALTER TABLE `orders` ADD COLUMN `shipmentId` VARCHAR(255) NULL;');
    console.log('Successfully added shipmentId column');
  } catch (err) {
    console.log('shipmentId column already exists or error:', err.message);
  }

  await connection.end();
}

alterTable();
