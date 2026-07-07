require('dotenv').config();
const mysql = require('mysql2/promise');

async function createFaqTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'mrmed_db'
  });
  
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`faqs\` (
        \`id\` INTEGER auto_increment , 
        \`question\` VARCHAR(255) NOT NULL, 
        \`answer\` TEXT NOT NULL, 
        \`isActive\` TINYINT(1) DEFAULT 1, 
        \`displayOrder\` INTEGER DEFAULT 0, 
        \`createdAt\` DATETIME NOT NULL, 
        \`updatedAt\` DATETIME NOT NULL, 
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
    // Table created successfully

    
    console.log('Successfully created faqs table');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await connection.end();
  }
}

createFaqTable();
