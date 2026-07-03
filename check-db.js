const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'rootpassword', // Let's check .env for DB_PASS
    database: 'mrmed_db'
  });
  const [rows] = await connection.execute('SELECT id, name FROM medicines');
  console.log('Medicines:', rows);
  await connection.end();
}
run();
