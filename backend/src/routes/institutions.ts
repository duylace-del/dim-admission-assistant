import { Router, Response } from 'express';
import { getUniversities, getColleges } from '../db/database';

const router = Router();

router.get('/universities', (_, res: Response) => {
  try {
    res.json({ success: true, data: getUniversities() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/colleges', (_, res: Response) => {
  try {
    res.json({ success: true, data: getColleges() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
