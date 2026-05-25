import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Eye, EyeOff, AlertCircle, Database,
  BookOpen, GraduationCap, Stethoscope, School,
  Plus, Trash2, Upload, CheckCircle, RefreshCw, ChevronDown, X,
  Building2, Edit2, Bell, Users, User, Mail, FileSpreadsheet, List,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  adminLogin, adminBulkUpload, adminAddSpecialty, adminDeleteSpecialty,
  adminDeleteLevel, fetchCounts, fetchSpecialties,
  fetchUniversities, fetchColleges,
  adminSaveUniversity, adminDeleteUniversity,
  adminSaveCollege, adminDeleteCollege,
  UniversityData, CollegeData,
} from '../lib/api';
import { Specialty } from '../data/specialties';

// ─── types ────────────────────────────────────────────────────
type Level = 'bakalavr' | 'magistr' | 'rezidentura' | 'kollec_9' | 'kollec_11' | 'subbakalavr';
type Section = 'ixtisaslar' | 'muessiseler' | 'abuneciler' | 'istifadeciler';
type InstitutionTab = 'universities' | 'colleges';

const LEVELS: { id: Level; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'bakalavr',    label: 'Bakalavriat',    icon: <GraduationCap size={18} />, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
  { id: 'magistr',     label: 'Magistratura',   icon: <BookOpen size={18} />,      color: 'text-purple-400 border-purple-500/30 bg-purple-500/5' },
  { id: 'rezidentura', label: 'Rezidentura',    icon: <Stethoscope size={18} />,   color: 'text-red-400 border-red-500/30 bg-red-500/5' },
  { id: 'kollec_9',    label: 'Kollec 9-illik', icon: <School size={18} />,        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
  { id: 'kollec_11',   label: 'Kollec 11-illik',icon: <School size={18} />,        color: 'text-teal-400 border-teal-500/30 bg-teal-500/5' },
  { id: 'subbakalavr', label: 'Subbakalavr',    icon: <Database size={18} />,      color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
];

const EMPTY_FORM = {
  name: '', universityName: '', universityShort: '',
  city: 'Bakı', region: 'bakı', group: 'I',
  bal_odenis: '', bal_dovlet: '', plan: '30', isSpecial: false,
};

const EMPTY_UNI: UniversityData = {
  id: '', name: '', shortName: '', city: 'Bakı', region: 'bakı',
  website: '', about: '', color: '#2980b9', emoji: '🎓',
  logo: '', established: new Date().getFullYear(), studentCount: '',
  type: 'dövlət',
};

const EMPTY_COLLEGE: CollegeData = {
  id: '', name: '', shortName: '', city: 'Bakı',
  website: '', about: '', color: '#10b981', emoji: '🏫',
  logo: '', established: new Date().getFullYear(), studentCount: '',
  type: 'dövlət',
};

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── component ────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed]     = useState(false);
  const [token, setToken]       = useState('');
  const [pwInput, setPwInput]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [section, setSection] = useState<Section>('ixtisaslar');
  const [activeTab, setActiveTab] = useState<Level>('bakalavr');
  const [counts, setCounts]       = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<Record<Level, string>>({} as any);
  const [uploadLoading, setUploadLoading] = useState<Record<Level, boolean>>({} as any);
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual form
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [formMsg, setFormMsg]   = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete-all confirm
  const [confirmDelete, setConfirmDelete] = useState<Level | null>(null);

  // ── Institution management ──
  const [instTab, setInstTab] = useState<InstitutionTab>('universities');
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [instLoading, setInstLoading] = useState(false);

  const [uniForm, setUniForm] = useState<UniversityData>({ ...EMPTY_UNI });
  const [uniMsg, setUniMsg] = useState('');
  const [uniSaving, setUniSaving] = useState(false);
  const [editingUniId, setEditingUniId] = useState<string | null>(null);

  const [collegeForm, setCollegeForm] = useState<CollegeData>({ ...EMPTY_COLLEGE });
  const [collegeMsg, setCollegeMsg] = useState('');
  const [collegeSaving, setCollegeSaving] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);

  const [confirmDeleteInst, setConfirmDeleteInst] = useState<{ type: 'uni' | 'col'; id: string; name: string } | null>(null);

  // ── Specialty list ──
  const [specList, setSpecList] = useState<Specialty[]>([]);
  const [specListLoading, setSpecListLoading] = useState(false);

  const loadSpecList = async (level: Level) => {
    setSpecListLoading(true);
    try {
      const data = await fetchSpecialties({ level, limit: 5000 });
      setSpecList(data);
    } catch {} finally { setSpecListLoading(false); }
  };

  const handleDeleteSpec = async (id: string) => {
    try {
      await adminDeleteSpecialty(token, id);
      setSpecList(prev => prev.filter(s => s.id !== id));
      loadCounts();
    } catch (err: any) { alert(err.message); }
  };

  // ── Subscribers ──
  const [subscribers, setSubscribers] = useState<Array<{ id: string; email: string; lang: string; createdAt: string }>>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // ── Users ──
  const [users, setUsers] = useState<Array<{ id: string; username: string; email: string; createdAt: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {} finally { setUsersLoading(false); }
  };

  const loadSubscribers = async () => {
    setSubsLoading(true);
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/admin/subscribers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSubscribers(data.data);
    } catch {} finally { setSubsLoading(false); }
  };

  const handleDeleteSubscriber = async (id: string) => {
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    await fetch(`${API_URL}/api/admin/subscriber/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSubscribers(prev => prev.filter(s => s.id !== id));
  };

  // ── auth ──
  const handleLogin = async () => {
    if (!pwInput.trim()) return;
    setLoginLoading(true);
    setLoginErr('');
    try {
      const t = await adminLogin(pwInput.trim());
      setToken(t);
      setAuthed(true);
    } catch (err: any) {
      setLoginErr(err.message || 'Giriş uğursuz oldu');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadCounts = async () => {
    setCountsLoading(true);
    try { setCounts(await fetchCounts()); } catch {} finally { setCountsLoading(false); }
  };

  const loadInstitutions = async () => {
    setInstLoading(true);
    try {
      const [unis, cols] = await Promise.all([fetchUniversities(), fetchColleges()]);
      setUniversities(unis);
      setColleges(cols);
    } catch {} finally { setInstLoading(false); }
  };

  useEffect(() => {
    if (authed) { loadCounts(); loadInstitutions(); loadSubscribers(); loadUsers(); loadSpecList(activeTab); }
  }, [authed]);

  useEffect(() => {
    if (authed) loadSpecList(activeTab);
  }, [activeTab]);

  // ── File upload (JSON + Excel) ──
  const handleFileUpload = async (level: Level) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploadLoading(p => ({ ...p, [level]: true }));
    setUploadStatus(p => ({ ...p, [level]: '' }));
    try {
      let arr: any[] = [];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        arr = Array.isArray(parsed) ? parsed : parsed.specialties || parsed.data || [];
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        // Map Excel columns → backend fields
        arr = rows.map(r => ({
          name: r.name || r['İxtisas adı'] || r['Ad'] || '',
          universityName: r.universityName || r['Universitet'] || r['Müəssisə'] || '',
          universityShort: r.universityShort || r['Qısa ad'] || '',
          group: r.group || r['Qrup'] || 'I',
          level,
          bal_odenis: r.bal_odenis ?? r['Ödənişli bal'] ?? null,
          bal_dovlet: r.bal_dovlet ?? r['Dövlət balı'] ?? null,
          plan: r.plan || r['Plan'] || 30,
          language: r.language || r['Dil'] || 'Azərbaycan dili',
        })).filter(r => r.name && r.universityName);
      } else {
        throw new Error('Yalnız .json, .xlsx, .xls faylları dəstəklənir');
      }

      if (!arr.length) throw new Error('Faylda ixtisas tapılmadı');
      const result = await adminBulkUpload(token, level, arr);
      setUploadStatus(p => ({ ...p, [level]: `✅ ${result.inserted} ixtisas yükləndi` }));
      loadCounts();
      loadSpecList(level);
    } catch (err: any) {
      setUploadStatus(p => ({ ...p, [level]: `❌ ${err.message}` }));
    } finally {
      setUploadLoading(p => ({ ...p, [level]: false }));
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── manual add specialty ──
  const handleAddSpec = async () => {
    if (!form.name || !form.universityName) {
      setFormMsg('❌ Ad və universitet mütləqdir');
      return;
    }
    setFormLoading(true); setFormMsg('');
    try {
      await adminAddSpecialty(token, {
        ...form, level: activeTab,
        bal_odenis: form.bal_odenis ? Number(form.bal_odenis) : null,
        bal_dovlet: form.bal_dovlet ? Number(form.bal_dovlet) : null,
        plan: Number(form.plan) || 30,
      });
      setFormMsg('✅ Əlavə edildi');
      setForm({ ...EMPTY_FORM });
      loadCounts();
      loadSpecList(activeTab);
    } catch (err: any) {
      setFormMsg(`❌ ${err.message}`);
    } finally { setFormLoading(false); }
  };

  // ── delete level ──
  const handleDeleteLevel = async (level: Level) => {
    try {
      const r = await adminDeleteLevel(token, level);
      setConfirmDelete(null);
      loadCounts();
      loadSpecList(level);
      setUploadStatus(p => ({ ...p, [level]: `🗑 ${r.deleted} ixtisas silindi` }));
    } catch (err: any) { alert(err.message); }
  };

  // ── university save ──
  const handleSaveUni = async () => {
    if (!uniForm.name.trim()) { setUniMsg('❌ Ad mütləqdir'); return; }
    const row: UniversityData = {
      ...uniForm,
      id: uniForm.id || slugify(uniForm.name) || `uni-${Date.now()}`,
    };
    setUniSaving(true); setUniMsg('');
    try {
      await adminSaveUniversity(token, row);
      setUniMsg('✅ Saxlanıldı');
      setUniForm({ ...EMPTY_UNI });
      setEditingUniId(null);
      loadInstitutions();
    } catch (err: any) { setUniMsg(`❌ ${err.message}`); }
    finally { setUniSaving(false); }
  };

  const startEditUni = (u: UniversityData) => {
    setUniForm({ ...u });
    setEditingUniId(u.id);
    setUniMsg('');
  };

  // ── college save ──
  const handleSaveCollege = async () => {
    if (!collegeForm.name.trim()) { setCollegeMsg('❌ Ad mütləqdir'); return; }
    const row: CollegeData = {
      ...collegeForm,
      id: collegeForm.id || slugify(collegeForm.name) || `col-${Date.now()}`,
    };
    setCollegeSaving(true); setCollegeMsg('');
    try {
      await adminSaveCollege(token, row);
      setCollegeMsg('✅ Saxlanıldı');
      setCollegeForm({ ...EMPTY_COLLEGE });
      setEditingCollegeId(null);
      loadInstitutions();
    } catch (err: any) { setCollegeMsg(`❌ ${err.message}`); }
    finally { setCollegeSaving(false); }
  };

  const startEditCollege = (c: CollegeData) => {
    setCollegeForm({ ...c });
    setEditingCollegeId(c.id);
    setCollegeMsg('');
  };

  // ── delete institution ──
  const handleDeleteInst = async () => {
    if (!confirmDeleteInst) return;
    try {
      if (confirmDeleteInst.type === 'uni') {
        await adminDeleteUniversity(token, confirmDeleteInst.id);
        setUniversities(p => p.filter(u => u.id !== confirmDeleteInst.id));
      } else {
        await adminDeleteCollege(token, confirmDeleteInst.id);
        setColleges(p => p.filter(c => c.id !== confirmDeleteInst.id));
      }
      setConfirmDeleteInst(null);
    } catch (err: any) { alert(err.message); }
  };

  // ─── login screen ───────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="bg-blob bg-blob-1" /><div className="bg-blob bg-blob-2" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
          <div className="glass rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
                <p className="text-gray-400 text-sm">DİM İxtisas Bazası İdarəetmə</p>
              </div>
            </div>
            <div className="relative mb-4">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setLoginErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Admin şifrəsi"
                className="dim-input pr-12"
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginErr && (
              <p className="text-red-400 text-sm mb-4 flex items-center gap-1">
                <AlertCircle size={14} /> {loginErr}
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleLogin} disabled={loginLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loginLoading ? 'Yüklənir...' : <><Lock size={18} /> Daxil ol</>}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeLevelInfo = LEVELS.find(l => l.id === activeTab)!;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="bg-blob bg-blob-1" /><div className="bg-blob bg-blob-2" />
      <div className="max-w-5xl mx-auto relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Paneli</h1>
            <p className="text-gray-400 text-sm mt-1">DİM ixtisas bazasını idarə et</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { loadCounts(); loadInstitutions(); }}
              className="glass p-2.5 rounded-xl text-gray-400 hover:text-white border border-white/10" title="Yenilə">
              <RefreshCw size={16} className={countsLoading || instLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { setAuthed(false); setToken(''); }}
              className="glass px-4 py-2.5 rounded-xl text-gray-400 hover:text-red-400 border border-white/10 text-sm">
              Çıxış
            </button>
          </div>
        </div>

        {/* Section toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSection('ixtisaslar')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${section === 'ixtisaslar' ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' : 'glass border-white/10 text-gray-400 hover:text-white'}`}
          >
            <Database size={16} /> İxtisaslar
          </button>
          <button
            onClick={() => setSection('muessiseler')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${section === 'muessiseler' ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40' : 'glass border-white/10 text-gray-400 hover:text-white'}`}
          >
            <Building2 size={16} /> Müəssisələr
          </button>
          <button
            onClick={() => { setSection('abuneciler'); loadSubscribers(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${section === 'abuneciler' ? 'bg-amber-600/20 text-amber-300 border-amber-500/40' : 'glass border-white/10 text-gray-400 hover:text-white'}`}
          >
            <Bell size={16} /> Abunəçilər
            {subscribers.length > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{subscribers.length}</span>}
          </button>
          <button
            onClick={() => { setSection('istifadeciler'); loadUsers(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${section === 'istifadeciler' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'glass border-white/10 text-gray-400 hover:text-white'}`}
          >
            <Users size={16} /> İstifadəçilər
            {users.length > 0 && <span className="ml-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{users.length}</span>}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {section === 'ixtisaslar' && (
            <motion.div key="ixtisaslar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Stats bar */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                {LEVELS.map(l => (
                  <div key={l.id} className={`glass rounded-2xl p-3 border text-center ${l.color}`}>
                    <div className="text-lg font-black">{counts[l.id] ?? '—'}</div>
                    <div className="text-xs mt-0.5 opacity-70">{l.label}</div>
                  </div>
                ))}
              </div>

              {/* Level tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => { setActiveTab(l.id); setFormMsg(''); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeTab === l.id ? l.color + ' border-opacity-60' : 'glass border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {l.icon} {l.label}
                    {counts[l.id] !== undefined && <span className="text-xs opacity-60">({counts[l.id]})</span>}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* File Upload (JSON + Excel) */}
                  <div className={`glass rounded-2xl p-6 border ${activeLevelInfo.color}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Upload size={20} className="opacity-80" />
                      <h2 className="font-bold text-white text-lg">Fayl ilə Yüklə</h2>
                      <span className="text-xs opacity-50 ml-auto">— {activeLevelInfo.label} jurnalı</span>
                    </div>

                    {/* Format tabs */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="font-bold text-blue-300 mb-1.5 flex items-center gap-1.5"><FileSpreadsheet size={13} /> Excel (.xlsx)</div>
                        <div className="text-gray-400 font-mono text-[11px] leading-relaxed">Sütunlar: name | universityName | group | bal_odenis | bal_dovlet | plan</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="font-bold text-purple-300 mb-1.5 flex items-center gap-1.5"><Upload size={13} /> JSON (.json)</div>
                        <div className="text-gray-400 font-mono text-[11px] leading-relaxed">{`[{"name":"...","universityName":"...","bal_odenis":350,"bal_dovlet":420}]`}</div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      📌 Mövcud <strong>{activeLevelInfo.label}</strong> ixtisasları silinmir — eyni ID varsa üzərinə yazılır.
                      Bütün jurnalı əvəz etmək üçün əvvəlcə <span className="text-red-400">Hamısını sil</span> düyməsini istifadə edin.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      <label className="flex-1">
                        <input ref={fileRef} type="file" accept=".json,.xlsx,.xls" className="hidden" onChange={() => handleFileUpload(activeTab)} />
                        <span onClick={() => fileRef.current?.click()}
                          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl cursor-pointer hover:opacity-90 transition-opacity text-sm">
                          {uploadLoading[activeTab] ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                          JSON / Excel Fayl Seç
                        </span>
                      </label>
                      <button onClick={() => setConfirmDelete(activeTab)}
                        className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-red-500/30 transition-colors">
                        <Trash2 size={16} /> Hamısını Sil
                      </button>
                    </div>
                    {uploadStatus[activeTab] && (
                      <p className={`mt-3 text-sm font-medium ${uploadStatus[activeTab].startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {uploadStatus[activeTab]}
                      </p>
                    )}
                  </div>

                  {/* Manual form */}
                  <div className="glass rounded-2xl p-6 border border-white/8">
                    <div className="flex items-center gap-3 mb-5">
                      <Plus size={20} className="text-gray-400" />
                      <h2 className="font-bold text-white text-lg">Tək İxtisas Əlavə Et</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">İxtisas Adı *</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Kompüter mühəndisliyi" className="dim-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Universitet / Kollec Adı *</label>
                        <input value={form.universityName} onChange={e => setForm(p => ({ ...p, universityName: e.target.value }))} placeholder="Bakı Dövlət Universiteti" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Qısa Ad</label>
                        <input value={form.universityShort} onChange={e => setForm(p => ({ ...p, universityShort: e.target.value }))} placeholder="BDU" className="dim-input" />
                      </div>
                      {activeTab === 'bakalavr' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Qrup</label>
                          <div className="relative">
                            <select value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))} className="dim-input appearance-none pr-8">
                              {['I','II','III','IV','V'].map(g => <option key={g}>{g}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Ödənişli Keçid Balı</label>
                        <input type="number" value={form.bal_odenis} onChange={e => setForm(p => ({ ...p, bal_odenis: e.target.value }))} placeholder="355.0" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Dövlət Yeri Balı</label>
                        <input type="number" value={form.bal_dovlet} onChange={e => setForm(p => ({ ...p, bal_dovlet: e.target.value }))} placeholder="552.0" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Plan Yeri</label>
                        <input type="number" value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} placeholder="30" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Şəhər</label>
                        <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Bakı" className="dim-input" />
                      </div>
                    </div>
                    {formMsg && (
                      <p className={`mt-4 text-sm font-medium flex items-center gap-1 ${formMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {formMsg.startsWith('✅') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {formMsg}
                      </p>
                    )}
                    <div className="flex gap-3 mt-5">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleAddSpec} disabled={formLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-60">
                        <Plus size={16} /> {formLoading ? 'Əlavə edilir...' : 'Əlavə Et'}
                      </motion.button>
                      <button onClick={() => { setForm({ ...EMPTY_FORM }); setFormMsg(''); }}
                        className="glass px-4 py-3 rounded-xl text-gray-400 border border-white/10 text-sm">
                        Sıfırla
                      </button>
                    </div>
                  </div>

                  {/* Specialty List */}
                  <div className="glass rounded-2xl p-6 border border-white/8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <List size={20} className="text-gray-400" />
                        <h2 className="font-bold text-white text-lg">
                          {activeLevelInfo.label} İxtisasları
                        </h2>
                        <span className="text-xs text-gray-500">({specList.length} ədəd)</span>
                      </div>
                      <button onClick={() => loadSpecList(activeTab)}
                        className="glass p-2 rounded-xl text-gray-400 hover:text-white border border-white/10">
                        <RefreshCw size={14} className={specListLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {specListLoading ? (
                      <div className="text-center text-gray-500 py-8"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Yüklənir...</div>
                    ) : specList.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">Bu səviyyədə ixtisas yoxdur</div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-white/8 max-h-[500px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-[#0a1628] border-b border-white/10">
                            <tr className="text-gray-400">
                              <th className="text-left p-3 font-semibold">İxtisas Adı</th>
                              <th className="text-left p-3 font-semibold">Universitet</th>
                              <th className="text-center p-3 font-semibold">Qrup</th>
                              <th className="text-center p-3 font-semibold text-orange-300">Ödənişli</th>
                              <th className="text-center p-3 font-semibold text-green-300">Dövlət</th>
                              <th className="text-center p-3 font-semibold">Sil</th>
                            </tr>
                          </thead>
                          <tbody>
                            {specList.map((s, i) => (
                              <tr key={s.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                                <td className="p-3 text-white max-w-[200px]">
                                  <div className="truncate font-medium">{s.name}</div>
                                </td>
                                <td className="p-3 text-gray-400 max-w-[160px]">
                                  <div className="truncate">{s.universityShort || s.universityName}</div>
                                </td>
                                <td className="p-3 text-center text-gray-300">{s.group || '—'}</td>
                                <td className="p-3 text-center font-mono text-orange-300 font-bold">
                                  {s.bal_odenis ?? '—'}
                                </td>
                                <td className="p-3 text-center font-mono text-green-300 font-bold">
                                  {s.bal_dovlet ?? '—'}
                                </td>
                                <td className="p-3 text-center">
                                  <button onClick={() => handleDeleteSpec(s.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {section === 'muessiseler' && (
            <motion.div key="muessiseler" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass rounded-2xl p-3 border border-cyan-500/30 bg-cyan-500/5 text-center text-cyan-300">
                  <div className="text-lg font-black">{universities.length}</div>
                  <div className="text-xs mt-0.5 opacity-70">Ali Məktəb</div>
                </div>
                <div className="glass rounded-2xl p-3 border border-emerald-500/30 bg-emerald-500/5 text-center text-emerald-300">
                  <div className="text-lg font-black">{colleges.length}</div>
                  <div className="text-xs mt-0.5 opacity-70">Kollec</div>
                </div>
              </div>

              {/* Institution sub-tabs */}
              <div className="flex gap-2 mb-6">
                <button onClick={() => setInstTab('universities')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${instTab === 'universities' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' : 'glass border-white/10 text-gray-400 hover:text-white'}`}>
                  <Building2 size={16} /> Ali Məktəblər ({universities.length})
                </button>
                <button onClick={() => setInstTab('colleges')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${instTab === 'colleges' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'glass border-white/10 text-gray-400 hover:text-white'}`}>
                  <School size={16} /> Kolleclər ({colleges.length})
                </button>
              </div>

              {instTab === 'universities' && (
                <div className="space-y-5">
                  {/* University form */}
                  <div className="glass rounded-2xl p-6 border border-cyan-500/20">
                    <h2 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
                      {editingUniId ? <><Edit2 size={18} className="text-cyan-400" /> Universiteti Redaktə Et</> : <><Plus size={18} className="text-cyan-400" /> Yeni Universitet Əlavə Et</>}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tam Ad *</label>
                        <input value={uniForm.name} onChange={e => setUniForm(p => ({ ...p, name: e.target.value }))} placeholder="Bakı Dövlət Universiteti" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Qısa Ad *</label>
                        <input value={uniForm.shortName} onChange={e => setUniForm(p => ({ ...p, shortName: e.target.value }))} placeholder="BDU" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Şəhər</label>
                        <input value={uniForm.city} onChange={e => setUniForm(p => ({ ...p, city: e.target.value }))} placeholder="Bakı" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Region</label>
                        <input value={uniForm.region} onChange={e => setUniForm(p => ({ ...p, region: e.target.value }))} placeholder="bakı" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Növ</label>
                        <div className="relative">
                          <select value={uniForm.type} onChange={e => setUniForm(p => ({ ...p, type: e.target.value as any }))} className="dim-input appearance-none pr-8">
                            <option value="dövlət">Dövlət</option>
                            <option value="özəl">Özəl</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Vebsayt</label>
                        <input value={uniForm.website} onChange={e => setUniForm(p => ({ ...p, website: e.target.value }))} placeholder="https://example.edu.az" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Logo URL</label>
                        <input value={uniForm.logo || ''} onChange={e => setUniForm(p => ({ ...p, logo: e.target.value }))} placeholder="https://... (boş buraxsanız avtomatik axtarılır)" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Emoji</label>
                        <input value={uniForm.emoji} onChange={e => setUniForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🎓" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rəng (hex)</label>
                        <input value={uniForm.color} onChange={e => setUniForm(p => ({ ...p, color: e.target.value }))} placeholder="#2980b9" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Təsis ili</label>
                        <input type="number" value={uniForm.established} onChange={e => setUniForm(p => ({ ...p, established: Number(e.target.value) }))} className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tələbə sayı</label>
                        <input value={uniForm.studentCount || ''} onChange={e => setUniForm(p => ({ ...p, studentCount: e.target.value }))} placeholder="10.000+" className="dim-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Haqqında</label>
                        <textarea value={uniForm.about} onChange={e => setUniForm(p => ({ ...p, about: e.target.value }))} rows={2} placeholder="Universitet haqqında qısa məlumat..." className="dim-input resize-none" />
                      </div>
                    </div>
                    {uniMsg && (
                      <p className={`mt-3 text-sm font-medium flex items-center gap-1 ${uniMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {uniMsg.startsWith('✅') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {uniMsg}
                      </p>
                    )}
                    <div className="flex gap-3 mt-4">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSaveUni} disabled={uniSaving}
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-60">
                        <Plus size={16} /> {uniSaving ? 'Saxlanılır...' : editingUniId ? 'Yenilə' : 'Əlavə Et'}
                      </motion.button>
                      {editingUniId && (
                        <button onClick={() => { setUniForm({ ...EMPTY_UNI }); setEditingUniId(null); setUniMsg(''); }}
                          className="glass px-4 py-3 rounded-xl text-gray-400 border border-white/10 text-sm">
                          Ləğv et
                        </button>
                      )}
                    </div>
                  </div>

                  {/* University list */}
                  <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/8 font-semibold text-white text-sm">
                      Cari Universitetlər ({universities.length})
                    </div>
                    <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                      {universities.map(u => (
                        <div key={u.id} className="flex items-center gap-3 px-6 py-3 hover:bg-white/3 transition-colors">
                          <span className="text-xl shrink-0">{u.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.shortName} · {u.city}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => startEditUni(u)} className="text-gray-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setConfirmDeleteInst({ type: 'uni', id: u.id, name: u.name })} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {instTab === 'colleges' && (
                <div className="space-y-5">
                  {/* College form */}
                  <div className="glass rounded-2xl p-6 border border-emerald-500/20">
                    <h2 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
                      {editingCollegeId ? <><Edit2 size={18} className="text-emerald-400" /> Kolleci Redaktə Et</> : <><Plus size={18} className="text-emerald-400" /> Yeni Kollec Əlavə Et</>}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tam Ad *</label>
                        <input value={collegeForm.name} onChange={e => setCollegeForm(p => ({ ...p, name: e.target.value }))} placeholder="BDU nəzdində İqtisadiyyat Kolleci" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Qısa Ad *</label>
                        <input value={collegeForm.shortName} onChange={e => setCollegeForm(p => ({ ...p, shortName: e.target.value }))} placeholder="BDU-İK" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Şəhər</label>
                        <input value={collegeForm.city} onChange={e => setCollegeForm(p => ({ ...p, city: e.target.value }))} placeholder="Bakı" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Növ</label>
                        <div className="relative">
                          <select value={collegeForm.type} onChange={e => setCollegeForm(p => ({ ...p, type: e.target.value as any }))} className="dim-input appearance-none pr-8">
                            <option value="dövlət">Dövlət</option>
                            <option value="özəl">Özəl</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Vebsayt</label>
                        <input value={collegeForm.website} onChange={e => setCollegeForm(p => ({ ...p, website: e.target.value }))} placeholder="https://example.edu.az" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Emoji</label>
                        <input value={collegeForm.emoji} onChange={e => setCollegeForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🏫" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rəng (hex)</label>
                        <input value={collegeForm.color} onChange={e => setCollegeForm(p => ({ ...p, color: e.target.value }))} placeholder="#10b981" className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Təsis ili</label>
                        <input type="number" value={String(collegeForm.established)} onChange={e => setCollegeForm(p => ({ ...p, established: e.target.value }))} className="dim-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tələbə sayı</label>
                        <input value={collegeForm.studentCount || ''} onChange={e => setCollegeForm(p => ({ ...p, studentCount: e.target.value }))} placeholder="1.000+" className="dim-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Haqqında</label>
                        <textarea value={collegeForm.about} onChange={e => setCollegeForm(p => ({ ...p, about: e.target.value }))} rows={2} placeholder="Kollec haqqında qısa məlumat..." className="dim-input resize-none" />
                      </div>
                    </div>
                    {collegeMsg && (
                      <p className={`mt-3 text-sm font-medium flex items-center gap-1 ${collegeMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {collegeMsg.startsWith('✅') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {collegeMsg}
                      </p>
                    )}
                    <div className="flex gap-3 mt-4">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSaveCollege} disabled={collegeSaving}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-60">
                        <Plus size={16} /> {collegeSaving ? 'Saxlanılır...' : editingCollegeId ? 'Yenilə' : 'Əlavə Et'}
                      </motion.button>
                      {editingCollegeId && (
                        <button onClick={() => { setCollegeForm({ ...EMPTY_COLLEGE }); setEditingCollegeId(null); setCollegeMsg(''); }}
                          className="glass px-4 py-3 rounded-xl text-gray-400 border border-white/10 text-sm">
                          Ləğv et
                        </button>
                      )}
                    </div>
                  </div>

                  {/* College list */}
                  <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/8 font-semibold text-white text-sm">
                      Cari Kolleclər ({colleges.length})
                    </div>
                    <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                      {colleges.map(c => (
                        <div key={c.id} className="flex items-center gap-3 px-6 py-3 hover:bg-white/3 transition-colors">
                          <span className="text-xl shrink-0">{c.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{c.name}</div>
                            <div className="text-xs text-gray-500">{c.shortName} · {c.city}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => startEditCollege(c)} className="text-gray-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setConfirmDeleteInst({ type: 'col', id: c.id, name: c.name })} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {section === 'istifadeciler' && (
            <motion.div key="istifadeciler" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" /> Qeydiyyatdan Keçmiş İstifadəçilər ({users.length})
                </h3>
                <button onClick={loadUsers} className="glass px-3 py-1.5 rounded-xl text-gray-400 border border-white/10 hover:text-white text-xs flex items-center gap-1.5">
                  <RefreshCw size={13} className={usersLoading ? 'animate-spin' : ''} /> Yenilə
                </button>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Hələ qeydiyyatdan keçmiş istifadəçi yoxdur</p>
                </div>
              ) : (
                <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="dim-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>İstifadəçi adı</th>
                          <th>E-poçt</th>
                          <th>Qeydiyyat tarixi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr key={u.id}>
                            <td className="text-gray-500 text-sm font-mono">{i + 1}</td>
                            <td className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {u.username[0]?.toUpperCase()}
                              </div>
                              <span className="text-white text-sm font-medium">{u.username}</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <User size={13} className="text-indigo-400 shrink-0" />
                                <span className="text-gray-300 text-sm">{u.email}</span>
                              </div>
                            </td>
                            <td className="text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {section === 'abuneciler' && (
            <motion.div key="abuneciler" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Bell size={18} className="text-amber-400" /> E-poçt Abunəçiləri ({subscribers.length})
                </h3>
                <button onClick={loadSubscribers} className="glass px-3 py-1.5 rounded-xl text-gray-400 border border-white/10 hover:text-white text-xs flex items-center gap-1.5">
                  <RefreshCw size={13} className={subsLoading ? 'animate-spin' : ''} /> Yenilə
                </button>
              </div>

              {subscribers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bell size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Hələ abunəçi yoxdur</p>
                </div>
              ) : (
                <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="dim-table">
                      <thead>
                        <tr>
                          <th>E-poçt</th>
                          <th>Dil</th>
                          <th>Tarix</th>
                          <th>Sil</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map(s => (
                          <tr key={s.id}>
                            <td className="flex items-center gap-2">
                              <Mail size={14} className="text-amber-400 shrink-0" />
                              <span className="text-white text-sm">{s.email}</span>
                            </td>
                            <td>
                              <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                                {s.lang === 'az' ? '🇦🇿 AZ' : '🇷🇺 RU'}
                              </span>
                            </td>
                            <td className="text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString('az-AZ')}</td>
                            <td>
                              <button onClick={() => handleDeleteSubscriber(s.id)}
                                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete specialty level modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-6 border border-red-500/30 max-w-sm w-full"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <Trash2 size={24} className="text-red-400" />
                <h3 className="text-lg font-bold text-white">Hamısını Sil</h3>
                <button onClick={() => setConfirmDelete(null)} className="ml-auto text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-gray-300 text-sm mb-5">
                <strong className="text-red-400">{LEVELS.find(l => l.id === confirmDelete)?.label}</strong> jurnalındakı
                bütün <strong>{counts[confirmDelete] ?? 0}</strong> ixtisas silinəcək. Bu əməliyyat geri alına bilməz.
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleDeleteLevel(confirmDelete)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                  Bəli, Sil
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 glass text-gray-300 font-semibold py-2.5 rounded-xl text-sm border border-white/10">
                  Ləğv et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete institution modal */}
      <AnimatePresence>
        {confirmDeleteInst && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDeleteInst(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-6 border border-red-500/30 max-w-sm w-full"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <Trash2 size={24} className="text-red-400" />
                <h3 className="text-lg font-bold text-white">Sil</h3>
                <button onClick={() => setConfirmDeleteInst(null)} className="ml-auto text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-gray-300 text-sm mb-5">
                <strong className="text-red-400">«{confirmDeleteInst.name}»</strong> silinəcək. Bu əməliyyat geri alına bilməz.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDeleteInst}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                  Bəli, Sil
                </button>
                <button onClick={() => setConfirmDeleteInst(null)}
                  className="flex-1 glass text-gray-300 font-semibold py-2.5 rounded-xl text-sm border border-white/10">
                  Ləğv et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
