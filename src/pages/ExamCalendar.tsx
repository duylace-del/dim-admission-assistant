import { useState } from 'react';
import { motion } from 'framer-motion';
import { examEvents, ExamEvent } from '../data/examCalendar';
import { Calendar, Filter, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

type CategoryFilter = 'hamısı' | ExamEvent['category'];

const catLabels: Record<string, string> = {
  'hamısı': '📋 Hamısı',
  bakalavr: '🎓 Bakalavriat',
  magistr: '📚 Magistratura',
  kollec: '🏫 Kollec',
  subbakalavr: '📜 Subbakalavr',
  rezidentura: '⚕️ Rezidentura',
  dovletQulluqu: '🏛️ Dövlət Qulluğu',
  doktorantura: '🔬 Doktorantura',
  digər: '📋 Digər',
};

const catColors: Record<string, string> = {
  bakalavr: 'border-blue-500 bg-blue-500/10 text-blue-300',
  magistr: 'border-purple-500 bg-purple-500/10 text-purple-300',
  kollec: 'border-green-500 bg-green-500/10 text-green-300',
  subbakalavr: 'border-yellow-500 bg-yellow-500/10 text-yellow-300',
  rezidentura: 'border-red-500 bg-red-500/10 text-red-300',
  dovletQulluqu: 'border-gray-500 bg-gray-500/10 text-gray-300',
  doktorantura: 'border-cyan-500 bg-cyan-500/10 text-cyan-300',
  digər: 'border-orange-500 bg-orange-500/10 text-orange-300',
};

const typeLabels: Record<ExamEvent['type'], string> = {
  qeydiyyat: '📝 Qeydiyyat',
  imtahan: '📊 İmtahan',
  ixtisasSecimi: '🎯 İxtisas Seçimi',
  erizə: '📋 Ərizə Qəbulu',
  netice: '🏆 Nəticə',
};

const azMonths = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function getMonthName(dateStr: string): string {
  const date = new Date(dateStr);
  const month = azMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${year} ${month}`;
}

export default function ExamCalendar() {
  const { t } = useLang();
  const [catFilter, setCatFilter] = useState<CategoryFilter>('hamısı');
  const [showPast, setShowPast] = useState(true);

  const filtered = examEvents.filter(e => {
    const matchCat = catFilter === 'hamısı' || e.category === catFilter;
    const matchPast = showPast || !e.isPast;
    return matchCat && matchPast;
  });

  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by month
  const grouped: Record<string, ExamEvent[]> = {};
  sorted.forEach(e => {
    const month = getMonthName(e.date);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(e);
  });

  const upcoming = filtered.filter(e => !e.isPast).length;
  const past = filtered.filter(e => e.isPast).length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-amber-600/20 border border-amber-500/30 px-4 py-2 rounded-full text-sm font-medium text-amber-300 mb-4">
            <Calendar size={16} />
            {t('cal_badge')}
          </div>
          <h1 className="text-4xl font-black text-white mb-3">{t('cal_title')}</h1>
          <p className="text-gray-400">{t('cal_subtitle')}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-white">{examEvents.length}</div>
            <div className="text-xs text-gray-400 mt-1">{t('cal_total_events')}</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{upcoming}</div>
            <div className="text-xs text-gray-400 mt-1">{t('cal_upcoming')}</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center border border-gray-500/20">
            <div className="text-2xl font-bold text-gray-400">{past}</div>
            <div className="text-xs text-gray-400 mt-1">{t('cal_past_count')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-8 border border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">{t('cal_filter')}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(catLabels) as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  catFilter === cat
                    ? 'bg-white/15 text-white border-white/20'
                    : 'glass border-white/8 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                {catLabels[cat]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showPast}
              onChange={e => setShowPast(e.target.checked)}
              className="rounded"
            />
            {t('cal_show_past')}
          </label>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, events]) => (
            <motion.div
              key={month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-strong px-4 py-2 rounded-xl font-bold text-white text-sm">
                  📅 {month}
                </div>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Events */}
              <div className="space-y-3">
                {events.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass rounded-2xl p-5 border transition-all hover:border-white/15 ${
                      event.isPast ? 'opacity-60 border-white/5' : 'border-white/8'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date badge */}
                      <div className={`shrink-0 text-center px-3 py-2 rounded-xl border ${
                        event.isPast ? 'bg-gray-500/20 border-gray-500/30' :
                        catColors[event.category] || 'bg-blue-500/20 border-blue-500/30'
                      }`}>
                        <div className="text-lg font-black text-white leading-none">
                          {new Date(event.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {azMonths[new Date(event.date).getMonth()].slice(0, 3)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className={`font-bold text-sm ${event.isPast ? 'text-gray-300' : 'text-white'}`}>
                            {event.title}
                          </h3>
                          {event.isPast ? (
                            <span className="badge bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs">
                              <CheckCircle size={10} className="mr-1" /> {t('cal_passed')}
                            </span>
                          ) : (
                            <span className="badge badge-success text-xs">
                              <AlertCircle size={10} className="mr-1" /> {t('cal_active')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`badge text-xs border ${catColors[event.category] || ''}`}>
                            {catLabels[event.category]}
                          </span>
                          <span className="badge badge-info text-xs">{typeLabels[event.type]}</span>
                          {event.endDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={11} />
                              {formatDate(event.date)} — {formatDate(event.endDate)}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-xs leading-relaxed">{event.description}</p>

                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
                          >
                            <ExternalLink size={11} />
                            {event.link.replace('https://', '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📅</div>
            <p>{t('cal_no_events')}</p>
          </div>
        )}

        {/* Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5"
        >
          <p className="text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {t('cal_note')} <a href="https://ekabinet.dim.gov.az" target="_blank" rel="noopener noreferrer" className="underline ml-1">ekabinet.dim.gov.az</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
