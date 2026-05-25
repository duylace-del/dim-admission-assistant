import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Globe, X, Search, ChevronDown, Loader2 } from 'lucide-react';
import { fetchUniversities, fetchSpecialties, UniversityData } from '../lib/api';
import { Specialty } from '../data/specialties';
import { useLang } from '../context/LanguageContext';

type GroupFilter = 'hamısı' | 'I' | 'II' | 'III' | 'IV' | 'V';

const groupColors: Record<string, string> = {
  I:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  II:  'bg-green-500/20 text-green-300 border-green-500/30',
  III: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IV:  'bg-red-500/20 text-red-300 border-red-500/30',
  V:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function getLogoSrc(logo?: string, website?: string): string | undefined {
  if (logo) return logo;
  if (website) {
    try {
      const domain = new URL(website).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {}
  }
  return undefined;
}

function UniversityCard({
  uni,
  specs,
  onClick,
}: {
  uni: UniversityData;
  specs: Specialty[];
  onClick: () => void;
}) {
  const uniSpecs = specs.filter(s => s.universityId === uni.name);
  const groups = [...new Set(uniSpecs.map(s => s.group))].sort();
  const logoSrc = getLogoSrc(uni.logo, uni.website);
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
      className="glass rounded-2xl p-5 border border-white/8 hover:border-blue-500/30 cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg overflow-hidden"
          style={{ background: logoSrc && !imgErr ? '#ffffff' : `${uni.color}40`, border: `2px solid ${uni.color}60` }}
        >
          {logoSrc && !imgErr ? (
            <img
              src={logoSrc}
              alt={uni.name}
              className="w-full h-full object-contain p-1.5"
              onError={() => setImgErr(true)}
            />
          ) : (
            <span>{uni.emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight group-hover:text-blue-300 transition-colors">
            {uni.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">{uni.shortName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${uni.type === 'dövlət' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
              {uni.type}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
        <MapPin size={12} />
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(uni.name + ' ' + uni.city)}`}
          target="_blank" rel="noopener noreferrer"
          className="hover:text-blue-400 hover:underline transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {uni.city}
        </a>
        <span className="mx-2">·</span>
        <span>{uni.established ? `${uni.established}-ci il` : 'Məlumat yoxdur'}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {groups.length > 0 ? groups.map(g => (
          <span key={g} className={`badge border text-xs ${groupColors[g] || ''}`}>{g} Qrup</span>
        )) : (
          <span className="text-xs text-gray-500">Məlumat yoxdur</span>
        )}
      </div>
    </motion.div>
  );
}

function UniversityDetail({
  uni,
  specs,
  onClose,
}: {
  uni: UniversityData;
  specs: Specialty[];
  onClose: () => void;
}) {
  const { t } = useLang();
  const [activeGroup, setActiveGroup] = useState<GroupFilter>('hamısı');
  const [imgErr, setImgErr] = useState(false);
  const logoSrc = getLogoSrc(uni.logo, uni.website);

  const allSpecs = specs.filter(s => s.universityId === uni.name);
  const groups = [...new Set(allSpecs.map(s => s.group))].sort();
  const filteredSpecs = activeGroup === 'hamısı' ? allSpecs : allSpecs.filter(s => s.group === activeGroup);

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
              style={{ background: logoSrc && !imgErr ? '#ffffff' : `${uni.color}40`, border: `2px solid ${uni.color}80` }}
            >
              {logoSrc && !imgErr ? (
                <img src={logoSrc} alt={uni.name} className="w-full h-full object-contain p-2.5" onError={() => setImgErr(true)} />
              ) : (
                <span>{uni.emoji}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-white mb-1">{uni.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{uni.shortName}</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(uni.name + ' ' + uni.city)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-blue-400 hover:underline transition-colors"
                  >
                    {uni.city}
                  </a>
                </span>
                {uni.established && <span>🗓️ {uni.established}</span>}
                {uni.studentCount && <span>👥 {uni.studentCount}</span>}
                {uni.website && (
                  <a href={uni.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    onClick={e => e.stopPropagation()}
                  >
                    <Globe size={13} /> {uni.website.replace('https://', '')}
                  </a>
                )}
              </div>
            </div>
            <button onClick={onClose} className="glass p-2 rounded-xl text-gray-400 hover:text-white transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mt-4">{uni.about}</p>
        </div>

        <div className="p-6">
          <h3 className="font-bold text-white text-lg mb-4">📚 {t('unis_specialties_title')}</h3>

          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setActiveGroup('hamısı')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeGroup === 'hamısı' ? 'bg-white/20 text-white' : 'glass text-gray-400 hover:text-white'}`}
            >
              {t('all')} ({allSpecs.length})
            </button>
            {groups.map(g => (
              <button key={g} onClick={() => setActiveGroup(g as GroupFilter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${activeGroup === g ? groupColors[g] : 'glass border-white/10 text-gray-400 hover:text-white'}`}
              >
                {g} {t('group')} ({allSpecs.filter(s => s.group === g).length})
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
                    <th>{t('group')}</th>
                    <th>💰 Ödənişli Bal</th>
                    <th>🆓 Dövlət Balı</th>
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
                      <td><span className={`badge border text-xs ${groupColors[spec.group]}`}>{spec.group}</span></td>
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

export default function UniversitiesPage() {
  const { t } = useLang();
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'hamısı' | 'dövlət' | 'özəl'>('hamısı');
  const [selectedUni, setSelectedUni] = useState<UniversityData | null>(null);

  useEffect(() => {
    Promise.all([
      fetchUniversities(),
      fetchSpecialties({ level: 'bakalavr' }),
    ]).then(([unis, specs]) => {
      setUniversities(unis);
      setSpecialties(specs);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = universities.filter(u => {
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
          <div className="inline-flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building2 size={16} />
            {t('unis_badge')}
          </div>
          <h1 className="text-4xl font-black text-white mb-3">{t('unis_title')}</h1>
          <p className="text-gray-400">{t('unis_sub')}</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('unis_search_placeholder')}
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
            <div className="text-sm text-gray-400 mb-6">{filtered.length} {t('universities_found')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((uni, i) => (
                <motion.div key={uni.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                  <UniversityCard uni={uni} specs={specialties} onClick={() => setSelectedUni(uni)} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedUni && (
          <UniversityDetail uni={selectedUni} specs={specialties} onClose={() => setSelectedUni(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
