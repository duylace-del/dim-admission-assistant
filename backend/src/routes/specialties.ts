import { Router, Request, Response } from 'express';
import { querySpecialties, countByLevel, SpecialtyRow } from '../db/database';

const router = Router();

function toFrontend(s: SpecialtyRow) {
  return {
    id: s.id,
    name: s.name,
    universityId: s.university_name,
    universityName: s.university_name,
    universityShort: s.university_short,
    city: s.city,
    region: s.region,
    group: s.group_code,
    level: s.level,
    bal_odenis: s.bal_odenis,
    bal_dovlet: s.bal_dovlet,
    plan: s.plan_places,
    applicants: s.applicants ?? null,
    isSpecial: s.is_special,
    language: s.language || 'Azərbaycan dili',
  };
}

// GET /api/specialties
router.get('/', (req: Request, res: Response) => {
  try {
    const { level, group, minBal, maxBal, region, payment, search } = req.query as Record<string, string>;
    let rows = querySpecialties({
      level,
      group,
      minBal: minBal !== undefined ? Number(minBal) : undefined,
      maxBal: maxBal !== undefined ? Number(maxBal) : undefined,
      region,
      payment,
    });
    // Client-side search filter
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.university_name.toLowerCase().includes(q) ||
        s.university_short.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, data: rows.map(toFrontend), total: rows.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/specialties/count
router.get('/count', (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: countByLevel() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
