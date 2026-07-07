const mysql = require('mysql2/promise');

async function alterTable() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'mrmed_db'
  });
  
  try {
    await connection.execute('ALTER TABLE `medicines` ADD COLUMN `packSize` TEXT NULL;');
    console.log('Successfully added packSize column');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error('Error adding column:', err);
    }
  } finally {
    await connection.end();
  }
}

alterTable();
