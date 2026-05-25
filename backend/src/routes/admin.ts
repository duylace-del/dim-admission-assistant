import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import {
  upsertSpecialties, deleteById, deleteByLevel, SpecialtyRow,
  upsertUniversity, deleteUniversityById, UniversityRow,
  upsertCollege, deleteCollegeById, CollegeRow,
  getUsers, deleteUser, updateUserPassword,
  getCalcConfig, saveCalcConfig, CalcTypeConfig,
} from '../db/database';
import { getSubscribersHandler, deleteSubscriberHandler } from './notify';

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Armagedon2026';

// POST /api/admin/login
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${ADMIN_PASSWORD}:dim`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: 'Yanlış şifrə' });
  }
});

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token göndərilməyib' });
  const expected = Buffer.from(`${ADMIN_PASSWORD}:dim`).toString('base64');
  if (auth.replace('Bearer ', '') !== expected)
    return res.status(403).json({ error: 'Giriş qadağandır' });
  next();
}

// ── helpers ──────────────────────────────────────────────────
function parseItem(item: any, fallbackLevel: string): SpecialtyRow {
  const name = item.name || item.ixtisasAdi || '';
  const uniName = item.universityName || item.university_name || item.universitetId || '';
  const uniShort = item.universityShort || item.university_short ||
    (uniName.length > 30 ? uniName.substring(0, 30) : uniName);
  const lvl = item.level || fallbackLevel;
  const grp = item.group || item.group_code || item.qrup || 'I';
  const city = item.city || deriveCity(uniName);
  const region = item.region || deriveRegion(uniName);
  const balOdenis = (item.bal_odenis !== undefined && item.bal_odenis !== null && item.bal_odenis !== '') ? Number(item.bal_odenis) : null;
  const balDovlet = (item.bal_dovlet !== undefined && item.bal_dovlet !== null && item.bal_dovlet !== '') ? Number(item.bal_dovlet) : null;
  const plan = Number(item.plan || item.plan_places || item.planYeri || 30);
  const isSpecial = item.isSpecial === true || item.isSpecial === 'true' || item.is_special === true;
  // Include specialty name slug + group in ID to avoid collisions
  const nameSlug = name.replace(/ /g, "+").toLowerCase();
  const code = item.code || item.ixtisasKodu || '';
  const id = item.id || (code
    ? `${lvl}-${code}-${uniShort.replace(/\s+/g, '').toLowerCase()}`
    : `${lvl}-${grp}-${uniShort.replace(/\s+/g, '').toLowerCase()}-${nameSlug}`);

  const applicants = item.applicants !== undefined && item.applicants !== '' ? Number(item.applicants) : null;

  return { id, name, university_name: uniName, university_short: uniShort,
    city, region, group_code: grp, level: lvl,
    bal_odenis: balOdenis, bal_dovlet: balDovlet,
    plan_places: plan, applicants, is_special: isSpecial,
    language: item.language || 'Azərbaycan dili' };
}

// POST /api/admin/upload — bulk JSON import
router.post('/upload', adminAuth, (req: Request, res: Response) => {
  try {
    const { level, specialties } = req.body as { level: string; specialties: any[] };
    if (!Array.isArray(specialties) || specialties.length === 0)
      return res.status(400).json({ success: false, error: 'specialties array boşdur' });

    const rows = specialties.map(item => parseItem(item, level));
    const count = upsertSpecialties(rows);
    res.json({ success: true, inserted: count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/specialty — add single
router.post('/specialty', adminAuth, (req: Request, res: Response) => {
  try {
    if (!req.body.name || !req.body.universityName) {
      return res.status(400).json({ success: false, error: 'Ad və universitet mütləqdir' });
    }
    const row = parseItem(req.body, req.body.level || 'bakalavr');
    upsertSpecialties([row]);
    res.json({ success: true, id: row.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/specialty/:id — update single
router.put('/specialty/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const row = parseItem({ ...req.body, id: req.params.id }, req.body.level || 'bakalavr');
    upsertSpecialties([row]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/specialty/:id
router.delete('/specialty/:id', adminAuth, (req: Request, res: Response) => {
  try {
    deleteById(decodeURIComponent(req.params.id as string));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/level/:level — delete all for a level
router.delete('/level/:level', adminAuth, (req: Request, res: Response) => {
  try {
    const deleted = deleteByLevel(req.params.level as string);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── university CRUD ───────────────────────────────────────────
router.post('/university', adminAuth, (req: Request, res: Response) => {
  try {
    const row = req.body as UniversityRow;
    if (!row.id || !row.name) return res.status(400).json({ success: false, error: 'id və name mütləqdir' });
    upsertUniversity(row);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/university/:id', adminAuth, (req: Request, res: Response) => {
  try {
    deleteUniversityById(decodeURIComponent(req.params.id as string));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── college CRUD ──────────────────────────────────────────────
router.post('/college', adminAuth, (req: Request, res: Response) => {
  try {
    const row = req.body as CollegeRow;
    if (!row.id || !row.name) return res.status(400).json({ success: false, error: 'id və name mütləqdir' });
    upsertCollege(row);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/college/:id', adminAuth, (req: Request, res: Response) => {
  try {
    deleteCollegeById(decodeURIComponent(req.params.id as string));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── subscribers (admin) ────────────────────────────────────────
router.get('/subscribers', adminAuth, getSubscribersHandler);
router.delete('/subscriber/:id', adminAuth, deleteSubscriberHandler);

// ── users (admin) ─────────────────────────────────────────────
router.get('/users', adminAuth, (_req: Request, res: Response) => {
  try {
    const users = getUsers().map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
      passwordHash: u.passwordHash,
    }));
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/user/:id', adminAuth, (req: Request, res: Response) => {
  try {
    deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/user/:id/password', adminAuth, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, error: 'Şifrə minimum 6 simvol olmalıdır' });
    const hash = await bcrypt.hash(password, 10);
    const ok = updateUserPassword(req.params.id, hash);
    if (!ok) return res.status(404).json({ success: false, error: 'İstifadəçi tapılmadı' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── calculator config (admin) ──────────────────────────────────
router.get('/calculator-config', adminAuth, (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: getCalcConfig() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/calculator-config', adminAuth, (req: Request, res: Response) => {
  try {
    const config = req.body as CalcTypeConfig[];
    if (!Array.isArray(config)) return res.status(400).json({ success: false, error: 'Array gözlənilir' });
    saveCalcConfig(config);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── geo helpers ───────────────────────────────────────────────
function deriveCity(name: string): string {
  if (!name) return 'Bakı';
  const cities = ['Gəncə','Naxçıvan','Sumqayıt','Lənkəran','Şəki','Qazax','Tovuz',
    'Quba','Şamaxı','Zaqatala','Ağdam','Ağdaş','Ağcabədi','Bərdə','Göyçay',
    'Sabirabad','Astara','İsmayıllı','Masallı','Mingəçevir','Şirvan'];
  return cities.find(c => name.includes(c)) || 'Bakı';
}

function deriveRegion(name: string): string {
  if (!name) return 'Bakı';
  if (name.includes('Gəncə')) return 'Gəncə';
  if (name.includes('Naxçıvan')) return 'Naxçıvan';
  if (name.includes('Sumqayıt')) return 'Sumqayıt';
  if (name.includes('Lənkəran')) return 'Lənkəran';
  if (name.includes('Xırdalan') || name.includes('Abşeron')) return 'Abşeron';
  if (['Ağdam','Şuşa','Bərdə','Ağcabədi'].some(x => name.includes(x))) return 'Qarabağ';
  if (name.includes('Quba') || name.includes('Qusar') || name.includes('Xaçmaz')) return 'Quba-Xaçmaz';
  if (name.includes('Şəki') || name.includes('Zaqatala') || name.includes('Qəbələ')) return 'Şəki-Zaqatala';
  if (name.includes('Şirvan') || name.includes('Sabirabad')) return 'Şirvan';
  if (name.includes('Mingəçevir')) return 'Mingəçevir';
  return 'Bakı';
}

export default router;
