import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/database';
import specialtiesRouter from './routes/specialties';
import adminRouter from './routes/admin';
import institutionsRouter from './routes/institutions';
import authRouter from './routes/auth';
import notifyRouter from './routes/notify';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));

app.use('/api/specialties', specialtiesRouter);
app.use('/api/admin', adminRouter);
app.use('/api', institutionsRouter);
app.use('/api/auth', authRouter);
app.use('/api', notifyRouter);

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

initDB();

app.listen(PORT, () => {
  console.log(`🚀 DİM Backend — http://localhost:${PORT}`);
  console.log(`   /api/specialties  — ixtisas sorğuları`);
  console.log(`   /api/admin        — admin əməliyyatları`);
});
