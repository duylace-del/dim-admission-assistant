import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, X, Search, ChevronDown, Loader2, School } from 'lucide-react';
import { fetchColleges, fetchSpecialties, CollegeData } from '../lib/api';
import { Specialty } from '../data/specialties';
import { useLang } from '../context/LanguageContext';

function normalizeCollegeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function CollegeCard({
  college,
  specs,
  onClick,
}: {
  college: CollegeData;
  specs: Specialty[];
  onClick: () => void;
}) {
  const collegeSpecs = specs.filter(s =>
    normalizeCollegeName(s.universityId) === normalizeCollegeName(college.name)
  );

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
      className="glass rounded-2xl p-5 border border-white/8 hover:border-emerald-500/30 cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg overflow-hidden"
          style={{ background: `${college.color}40`, border: `2px solid ${college.color}60` }}
        >
          <span>{college.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight group-hover:text-emerald-400 transition-colors">
            {college.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">{college.shortName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${college.type === 'dövlət' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
              Kollec ({college.type})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
        <MapPin size={12} />
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(college.name + ' ' + college.city)}`}
          target="_blank" rel="noopener noreferrer"
          className="hover:text-emerald-400 hover:underline transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {college.city}
        </a>
        <span className="mx-2">·</span>
        <span>{college.established && college.established !== '—' ? `${college.established}-ci il` : 'Məlumat yoxdur'}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="badge border text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold">
          📚 {collegeSpecs.length} İxtisas
        </span>
      </div>
    </motion.div>
  );
}

function CollegeDetail({
  college,
  specs,
  onClose,
}: {
  college: CollegeData;
  specs: Specialty[];
  onClose: () => void;
}) {
  const { t } = useLang();
  const [activeLevel, setActiveLevel] = useState<string>('hamısı');

  const allSpecs = specs.filter(s =>
    normalizeCollegeName(s.universityId) === normalizeCollegeName(college.name)
  );
  const levels = [...new Set(allSpecs.map(s => s.level))].sort();
  const filteredSpecs = activeLevel === 'hamısı' ? allSpecs : allSpecs.filter(s => s.level === activeLevel);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="w-full max-w-4xl glass-strong rounded-3xl border border-white/10 shadow-2xl mb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/8">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-xl"
              style={{ background: `${college.color}40`, border: `2px solid ${college.color}80` }}
            >
              <span>{college.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-white mb-1">{college.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{college.shortName}</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(college.name + ' ' + college.city)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-emerald-400 hover:underline transition-colors"
                  >
                    {college.city}
                  </a>
                </span>
                {college.established && college.established !== '—' && <span>🗓️ {college.established}</span>}
                {college.website && (
                  <a href={college.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                    onClick={e => e.stopPropagation()}
                  >
                    <Globe size={13} /> {college.website.replace('https://', '').replace('http://', '')}
                  </a>
                )}
              </div>
            </div>
            <button onClick={onClose} className="glass p-2 rounded-xl text-gray-400 hover:text-white transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mt-4">{college.about}</p>
        </div>

        <div className="p-6">
          <h3 className="font-bold text-white text-lg mb-4">🏫 {t('cols_specialties_title')}</h3>

          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setActiveLevel('hamısı')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeLevel === 'hamısı' ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : 'glass text-gray-400 hover:text-white'}`}
            >
              {t('all')} ({allSpecs.length})
            </button>
            {levels.map(l => (
              <button key={l} onClick={() => setActiveLevel(l)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${activeLevel === l ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : 'glass border-white/10 text-gray-400 hover:text-white'}`}
              >
                {l === 'kollec_9' ? '9 illik baza' : '11 illik baza'} ({allSpecs.filter(s => s.level === l).length})
              </button>
            ))}
          </div>

          {filteredSpecs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('uni_no_specs')}</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="dim-table">
                <thead>
                  <tr>
                    <th>{t('specialty')}</th>
                    <th>Baza</th>
                    <th>Ödənişli Bal</th>
                    <th>Dövlət Yeri Balı</th>
                    <th>{t('plan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecs.map((spec, i) => (
                    <motion.tr key={spec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                      <td>
                        <div className="text-white text-sm font-medium">{spec.name}</div>
                        {spec.isSpecial && (
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mt-1 inline-block border border-amber-500/20">
                            {t('special_exam')}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge border text-xs font-bold ${spec.level === 'kollec_9' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-teal-500/20 text-teal-300 border-teal-500/30'}`}>
                          {spec.level === 'kollec_9' ? '9 illik' : '11 illik'}
                        </span>
                      </td>
                      <td className="font-bold text-orange-300">{spec.bal_odenis ?? '—'}</td>
                      <td className="font-bold text-green-300">{spec.bal_dovlet ?? '—'}</td>
                      <td className="text-gray-400 text-sm">{spec.plan}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CollegesPage() {
  const { t } = useLang();
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'hamısı' | 'dövlət' | 'özəl'>('hamısı');
  const [selectedCollege, setSelectedCollege] = useState<CollegeData | null>(null);

  useEffect(() => {
    Promise.all([
      fetchColleges(),
      fetchSpecialties({ level: 'kollec_9' }),
      fetchSpecialties({ level: 'kollec_11' }),
    ]).then(([cols, s9, s11]) => {
      setColleges(cols);
      setSpecialties([...s9, ...s11]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = colleges.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'hamısı' || u.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <School size={16} />
            {t('cols_badge')}
          </div>
          <h1 className="text-4xl font-black text-white mb-3">{t('cols_title')}</h1>
          <p className="text-gray-400">{t('cols_sub')}</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('cols_search_placeholder')}
              className="dim-input pr-10"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              className="dim-input appearance-none pr-10 min-w-36 cursor-pointer"
            >
              <option value="hamısı">{t('all')}</option>
              <option value="dövlət">{t('state')}</option>
              <option value="özəl">{t('private')}</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={24} className="animate-spin" />
            {t('loading')}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-6">{filtered.length} {t('colleges_found')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((college, i) => (
                <motion.div key={college.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                  <CollegeCard college={college} specs={specialties} onClick={() => setSelectedCollege(college)} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedCollege && (
          <CollegeDetail college={selectedCollege} specs={specialties} onClose={() => setSelectedCollege(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
