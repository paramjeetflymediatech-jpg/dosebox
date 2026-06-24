import net from 'net';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Define port mapping
const PORT = process.env.PORT || 5050;

function checkMysqlPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function startServer() {
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || 'rootpassword';
  const dbName = process.env.DB_NAME || 'mrmed_db';

  console.log('[Server] Performing database connection pre-flight check...');
  const isMysqlUp = await checkMysqlPort(dbHost, dbPort);

  if (isMysqlUp) {
    try {
      console.log('[Server] MySQL port 3306 is open. Ensuring database exists...');
      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPass
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.end();
      console.log(`[Server] MySQL database '${dbName}' verified.`);
    } catch (dbErr: any) {
      console.warn(`[Server] MySQL database verification failed. Error: ${dbErr.message}`);
      console.warn('[Server] Falling back to SQLite in-memory database mode...');
      process.env.DB_FALLBACK = 'true';
    }
  } else {
    console.warn('[Server] MySQL is unreachable on port 3306. Falling back to SQLite...');
    process.env.DB_FALLBACK = 'true';
  }

  // Load Express app, Sequelize configs, and Seeder scripts dynamically AFTER fallback flags are set.
  // This guarantees Sequelize and models bind to the correct dialect on initial evaluation.
  const app = require('./app').default;
  const { sequelize } = require('./config/database');
  const { runSeeder } = require('./utils/seedData');

  try {
    console.log('[Server] Authenticating database connection...');
    await sequelize.authenticate();
    console.log('[Server] Database authenticated successfully.');

    console.log('[Server] Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('[Server] Database synchronization complete.');

    // Seed initial admin, pharmacist, categories, and trending medicines
    await runSeeder();

    app.listen(PORT, () => {
      const dbMode = process.env.DB_FALLBACK === 'true' ? 'SQLite In-Memory' : 'MySQL Server';
      console.log(`[Server] MrMed Express Server running in [${dbMode}] on port ${PORT}`);
      console.log(`[Server] Backend health checking available at http://localhost:${PORT}/health`);
    });
  } catch (err: any) {
    console.error('[Server] Critical server initialization error:', err.message || err);
    process.exit(1);
  }
}

startServer();
