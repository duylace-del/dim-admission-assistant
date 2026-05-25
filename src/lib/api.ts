import { Specialty } from '../data/specialties';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface FetchParams {
  level: string;
  group?: string;
  minBal?: number;
  maxBal?: number;
  region?: string;
  payment?: string;
  search?: string;
  limit?: number;
}

export interface UniversityData {
  id: string;
  name: string;
  shortName: string;
  city: string;
  region: string;
  website: string;
  about: string;
  color: string;
  emoji: string;
  logo?: string;
  established: number;
  studentCount?: string;
  type: 'dövlət' | 'özəl';
}

export interface CollegeData {
  id: string;
  name: string;
  shortName: string;
  city: string;
  website: string;
  established: string | number;
  studentCount?: string;
  logo?: string;
  emoji: string;
  color: string;
  type: 'dövlət' | 'özəl';
  about: string;
}

export async function fetchSpecialties(params: FetchParams): Promise<Specialty[]> {
  const q = new URLSearchParams();
  q.set('level', params.level);
  if (params.group && params.group !== 'all') q.set('group', params.group);
  if (params.minBal !== undefined) q.set('minBal', String(params.minBal));
  if (params.maxBal !== undefined) q.set('maxBal', String(params.maxBal));
  if (params.region && params.region !== 'hər yerdə') q.set('region', params.region);
  if (params.payment && params.payment !== 'hər ikisi') q.set('payment', params.payment);
  if (params.search) q.set('search', params.search);

  const res = await fetch(`${API_URL}/api/specialties?${q}`);
  if (!res.ok) throw new Error(`API xətası: ${res.status}`);
  const json = await res.json();
  return json.data as Specialty[];
}

export async function fetchAllSpecialties(): Promise<Specialty[]> {
  const levels = ['bakalavr', 'magistr', 'rezidentura', 'kollec_9', 'kollec_11', 'subbakalavr'];
  const results = await Promise.all(levels.map(l => fetchSpecialties({ level: l })));
  return results.flat();
}

export async function subscribeEmail(email: string, lang: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Abunəlik xətası');
  }
}

export async function fetchCounts(): Promise<Record<string, number>> {
  const res = await fetch(`${API_URL}/api/specialties/count`);
  if (!res.ok) throw new Error('Sayım xətası');
  const json = await res.json();
  return json.data;
}

export async function fetchUniversities(): Promise<UniversityData[]> {
  const res = await fetch(`${API_URL}/api/universities`);
  if (!res.ok) throw new Error('Universitetlər yüklənmədi');
  const json = await res.json();
  return json.data as UniversityData[];
}

export async function fetchColleges(): Promise<CollegeData[]> {
  const res = await fetch(`${API_URL}/api/colleges`);
  if (!res.ok) throw new Error('Kolleclər yüklənmədi');
  const json = await res.json();
  return json.data as CollegeData[];
}

export async function adminLogin(password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Yanlış şifrə');
  }
  const json = await res.json();
  return json.token as string;
}

export async function adminBulkUpload(
  token: string,
  level: string,
  specialties: unknown[]
): Promise<{ inserted: number }> {
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ level, specialties }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload xətası');
  }
  return res.json();
}

export async function adminAddSpecialty(token: string, spec: unknown): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/specialty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(spec),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Əlavə xətası');
  }
}

export async function adminDeleteSpecialty(token: string, id: string): Promise<void> {
  await fetch(`${API_URL}/api/admin/specialty/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminDeleteLevel(
  token: string,
  level: string
): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/api/admin/level/${encodeURIComponent(level)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Silmə xətası');
  return res.json();
}

export async function adminSaveUniversity(token: string, uni: UniversityData): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/university`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(uni),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Saxlama xətası');
  }
}

export async function adminDeleteUniversity(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/university/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Silmə xətası');
}

export async function adminSaveCollege(token: string, college: CollegeData): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/college`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(college),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Saxlama xətası');
  }
}

export async function adminDeleteCollege(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/college/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Silmə xətası');
}

// ── user management ───────────────────────────────────────────
export async function adminGetUsers(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('İstifadəçilər yüklənmədi');
  const json = await res.json();
  return json.data;
}

export async function adminDeleteUser(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/user/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Silmə xətası');
}

export async function adminUpdateUserPassword(token: string, id: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/user/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Şifrə yenilənmədi');
  }
}

// ── calculator config ─────────────────────────────────────────
export interface CalcSubjectConfig {
  key: string;
  label: string;
  coefficient: number;
  maxQ: number;
  maxKod: number;
  maxYazili: number;
  color: string;
}

export interface CalcTypeConfig {
  value: string;
  label: string;
  desc: string;
  category: 'attestat' | 'blok' | 'magistr' | 'rezidentura' | 'kollec' | 'subbakalavr';
  maxScore: number;
  subjects: CalcSubjectConfig[];
}

export async function fetchCalculatorConfig(): Promise<CalcTypeConfig[]> {
  const res = await fetch(`${API_URL}/api/calculator-config`);
  if (!res.ok) throw new Error('Config yüklənmədi');
  const json = await res.json();
  return json.data;
}

export async function adminSaveCalculatorConfig(token: string, config: CalcTypeConfig[]): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/calculator-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Saxlama xətası');
  }
}
