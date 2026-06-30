import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { env } from './config/env';
import { AuthError } from './auth/auth.service';
import { AppError } from './shared/app-error';
import authRouter from './auth/auth.router';
import collegesRouter from './colleges/colleges.router';
import departmentsRouter from './departments/departments.router';
import programsRouter from './programs/programs.router';
import coursesRouter from './courses/courses.router';
import outcomesRouter from './outcomes/outcomes.router';
import assessmentsRouter from './assessments/assessments.router';
import artifactsRouter from './artifacts/artifacts.router';
import indirectRouter from './indirect/indirect.router';
import reportsRouter from './reports/reports.router';

const app = express();

// =========================================================
// Security Middleware
// =========================================================
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'محاولات كثيرة، حاول بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

// =========================================================
// Routes
// =========================================================
app.use('/api/auth', authLimiter, authRouter);

// Phase 2 — Academic Structure
app.use('/api/colleges', collegesRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/outcomes', outcomesRouter);

// Phase 3 — Assessment & Attainment Engine
app.use('/api/assessments', assessmentsRouter);
app.use('/api/artifacts', artifactsRouter);
app.use('/api/indirect', indirectRouter);

// Phase 4 — Reports & PDF Export
app.use('/api/reports', reportsRouter);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Accred-IQ API', version: '2.0.0', timestamp: new Date().toISOString() });
});

// =========================================================
// Global Error Handler
// =========================================================
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(422).json({ success: false, message: 'بيانات غير صالحة', errors: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
    return;
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
});

// =========================================================
// Start Server
// =========================================================
app.listen(env.PORT, () => {
  console.log(`🚀 Accred-IQ API v2 تعمل على المنفذ ${env.PORT} — بيئة: ${env.NODE_ENV}`);
});

export default app;
