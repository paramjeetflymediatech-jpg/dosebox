import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import apiRouter from './routes/api';

const app = express();

// 1. Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: '*', // For test, allow any client. Can be locked down to specific origin in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Rate Limiter (protecting APIs from flooding, e.g. 15 mins, max 200 requests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 3. Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Static Uploads Folder serving (for viewing uploaded prescriptions)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 5. REST API Routing
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Default 404 Route
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Endpoint '${req.originalUrl}' not found` });
});

// 6. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err.stack || err.message || err);
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
