import { Router, Request, Response } from 'express';
import { addSubscriber, getSubscribers, deleteSubscriber } from '../db/database';

const router = Router();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// POST /api/subscribe
router.post('/subscribe', (req: Request, res: Response) => {
  const { email, lang } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Düzgün e-poçt ünvanı daxil edin' });
  }
  const added = addSubscriber({
    id: generateId(),
    email: email.toLowerCase().trim(),
    lang: lang || 'az',
    createdAt: new Date().toISOString(),
  });
  if (!added) {
    return res.status(409).json({ error: 'already_subscribed' });
  }
  res.json({ success: true, message: 'Uğurla abunə oldunuz' });
});

// GET /api/admin/subscribers  (admin-only — called from admin.ts)
export function getSubscribersHandler(req: Request, res: Response) {
  res.json({ success: true, data: getSubscribers() });
}

// DELETE /api/admin/subscriber/:id
export function deleteSubscriberHandler(req: Request, res: Response) {
  deleteSubscriber(req.params.id as string);
  res.json({ success: true });
}

export default router;
