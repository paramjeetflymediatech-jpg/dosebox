import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || 'rootpassword';
const dbName = process.env.DB_NAME || 'mrmed_db';
const nodeEnv = process.env.NODE_ENV || 'development';

// We support fallback to sqlite memory in case the mysql database is not ready or configured, to guarantee the app runs smoothly.
const isTestOrFallback = process.env.DB_FALLBACK === 'true' || process.env.NODE_ENV === 'test';

export const sequelize = isTestOrFallback 
  ? new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    })
  : new Sequelize(dbName, dbUser, dbPass, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: nodeEnv === 'development' ? (msg) => console.log(`[Sequelize] ${msg.substring(0, 150)}...`) : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

export default sequelize;
