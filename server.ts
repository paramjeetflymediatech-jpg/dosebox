import express from 'express';
import next from 'next';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import net from 'net';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 3000;

function checkMysqlPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

nextApp.prepare().then(async () => {
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || 'rootpassword';
  const dbName = process.env.DB_NAME || 'mrmed_db';

  console.log('[Server] Connecting to database...');
  const isMysqlUp = await checkMysqlPort(dbHost, dbPort);

  if (isMysqlUp) {
    try {
      const connection = await mysql.createConnection({ host: dbHost, port: dbPort, user: dbUser, password: dbPass });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.end();
      console.log(`[Server] MySQL database '${dbName}' verified.`);
    } catch (dbErr: any) {
      console.warn(`[Server] MySQL database verification failed: ${dbErr.message}`);
      process.env.DB_FALLBACK = 'true';
    }
  } else {
    console.warn('[Server] MySQL port not available. Falling back to SQLite...');
    process.env.DB_FALLBACK = 'true';
  }

  // Load Express configurations dynamically
  const app = require('./src/app').default;
  const { sequelize } = require('./src/config/database');
  const { runSeeder } = require('./src/utils/seedData');

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await runSeeder();

    // Direct all non-API and non-static-upload routes to Next.js handler
    app.all('*', (req: express.Request, res: express.Response) => {
      return handle(req, res);
    });

    app.listen(PORT, () => {
      console.log(`> App running on port ${PORT} in ${dev ? 'development' : 'production'} mode`);
    });
  } catch (err: any) {
    console.error('Critical initialization error:', err);
    process.exit(1);
  }
});
