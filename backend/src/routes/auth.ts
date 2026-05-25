import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, getUserById, createUser } from '../db/database';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dim-secret-2026';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Middleware to verify user JWT
export function userAuth(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token yoxdur' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token etibarsızdır' });
  }
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Bütün sahələr tələb olunur' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifrə minimum 6 simvol olmalıdır' });
    }
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Bu e-poçt artıq qeydiyyatdadır' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: generateId(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    createUser(user);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (e) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-poçt və şifrə tələb olunur' });
    }
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (e) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

// GET /api/auth/me
router.get('/me', userAuth, (req: Request, res: Response) => {
  const user = getUserById((req as any).userId);
  if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
  res.json({ user: { id: user.id, username: user.username, email: user.email } });
});

export default router;
