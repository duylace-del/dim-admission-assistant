import express from 'express';
import cors from 'cors';
import { initDB } from './db/database';
import specialtiesRouter from './routes/specialties';
import adminRouter from './routes/admin';
import institutionsRouter from './routes/institutions';
import authRouter from './routes/auth';
import notifyRouter from './routes/notify';

const app = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/specialties', specialtiesRouter);
app.use('/api/admin', adminRouter);
app.use('/api', institutionsRouter);
app.use('/api/auth', authRouter);
app.use('/api', notifyRouter);

app.get('/', (_, res) => res.json({ name: 'DİM Qəbul Köməkçisi API', status: 'ok', docs: '/api/health' }));
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

initDB();

export default app;
