import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api';

const app = express();

// 1. Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
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

// 6. Serve Frontend Build Statically
const frontendBuildPath = path.join(__dirname, '../../frontend/out');
app.use(express.static(frontendBuildPath, { extensions: ['html'] }));

// Default Route: Serve Frontend index.html for all non-API routes (to support React Router / Next.js client-side routing)
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  // Try to serve a matching HTML file if it exists, otherwise return a clean 404 JSON
  const notFoundPage = path.join(frontendBuildPath, '404.html');
  if (fs.existsSync(notFoundPage)) {
    return res.status(404).sendFile(notFoundPage);
  }
  return res.status(404).json({ success: false, message: 'Page Not Found. The frontend build may not be deployed yet.' });
});

// 7. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err.stack || err.message || err);
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
