import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, BookOpen, Building2, Calendar, ChevronRight, Star, Users, ArrowRight, CheckCircle, School } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function HomePage() {
  const { t, lang } = useLang();

  const features = [
    {
      icon: <BookOpen size={28} />,
      title: t('feat_wizard_title'),
      desc: t('feat_wizard_desc'),
      path: '/ixtilas-secimi',
      color: 'from-blue-600 to-blue-800',
      glow: 'rgba(59,130,246,0.3)',
    },
    {
      icon: <Calculator size={28} />,
      title: t('feat_calc_title'),
      desc: t('feat_calc_desc'),
      path: '/kalkulyator',
      color: 'from-purple-600 to-purple-800',
      glow: 'rgba(139,92,246,0.3)',
    },
    {
      icon: <Building2 size={28} />,
      title: t('feat_unis_title'),
      desc: t('feat_unis_desc'),
      path: '/universitetler',
      color: 'from-cyan-600 to-cyan-800',
      glow: 'rgba(6,182,212,0.3)',
    },
    {
      icon: <Calendar size={28} />,
      title: t('feat_calendar_title'),
      desc: t('feat_calendar_desc'),
      path: '/teqvim',
      color: 'from-amber-600 to-orange-700',
      glow: 'rgba(245,158,11,0.3)',
    },
  ];

  const levels = [
    { icon: '🎓', titleKey: 'level_bakalavr' as const, descKey: 'level_bakalavr_desc' as const, path: '/ixtilas-secimi', color: 'border-blue-500/40 hover:border-blue-400' },
    { icon: '📚', titleKey: 'level_magistr' as const, descKey: 'level_magistr_desc' as const, path: '/ixtilas-secimi', color: 'border-purple-500/40 hover:border-purple-400' },
    { icon: '⚕️', titleKey: 'level_rezidentura' as const, descKey: 'level_rezidentura_desc' as const, path: '/ixtilas-secimi', color: 'border-red-500/40 hover:border-red-400' },
    { icon: '🏫', titleKey: 'level_kollec' as const, descKey: 'level_kollec_desc' as const, path: '/ixtilas-secimi', color: 'border-green-500/40 hover:border-green-400' },
    { icon: '📜', titleKey: 'level_sub' as const, descKey: 'level_sub_desc' as const, path: '/ixtilas-secimi', color: 'border-amber-500/40 hover:border-amber-400' },
    { icon: '📉', titleKey: 'level_low100' as const, descKey: 'level_low100_desc' as const, path: '/ixtilas-secimi?lowscore=1', color: 'border-rose-500/40 hover:border-rose-400' },
  ];

  const steps = [
    { n: '01', titleKey: 'home_step1_title' as const, descKey: 'home_step1_desc' as const },
    { n: '02', titleKey: 'home_step2_title' as const, descKey: 'home_step2_desc' as const },
    { n: '03', titleKey: 'home_step3_title' as const, descKey: 'home_step3_desc' as const },
    { n: '04', titleKey: 'home_step4_title' as const, descKey: 'home_step4_desc' as const },
  ];

  const stats = [
    { icon: <Users size={20} />, value: '6400+', label: lang === 'az' ? 'İxtisas' : 'Специальностей' },
    { icon: <Building2 size={20} />, value: '50+', label: lang === 'az' ? 'Universitet' : 'Вузов' },
    { icon: <School size={20} />, value: '100+', label: lang === 'az' ? 'Kollec' : 'Колледжей' },
    { icon: <Star size={20} />, value: '2026', label: lang === 'az' ? 'Jurnal' : 'Журнал' },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-blue-300 mb-6 border border-blue-500/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {t('home_badge')}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
              DİM{' '}
              <span className="gradient-text">{t('home_title1')}</span>{' '}
              {t('home_title2')}
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('home_sub')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ixtilas-secimi"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-blue-500/25">
                <BookOpen size={20} />
                {t('home_cta_wizard')}
                <ArrowRight size={18} />
              </Link>
              <Link to="/kalkulyator"
                className="inline-flex items-center gap-2 glass text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/10">
                <Calculator size={20} />
                {t('home_cta_calc')}
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {stats.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-4 text-center border border-white/5">
                <div className="text-blue-400 flex justify-center mb-2">{s.icon}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Education Levels */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('home_levels_title')}</h2>
            <p className="text-gray-400">{lang === 'az' ? 'Öz imtahan pilləsini seç' : 'Выберите свой уровень экзамена'}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {levels.map((level, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="h-full">
                <Link to={level.path}
                  className={`flex flex-col items-center justify-center h-full min-h-[150px] glass rounded-2xl p-4 border hover-lift text-center transition-all duration-300 ${level.color}`}>
                  <div className="text-3xl mb-2">{level.icon}</div>
                  <h3 className="text-sm font-bold text-white mb-1 leading-tight">{t(level.titleKey)}</h3>
                  <p className="text-xs text-gray-500 leading-tight hidden sm:block">{t(level.descKey)}</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 font-medium">
                    {lang === 'az' ? 'Seç' : 'Выбрать'} <ChevronRight size={12} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('home_features_title')}</h2>
            <p className="text-gray-400">{lang === 'az' ? 'Abituriyentlər üçün lazım olan hər şey bir yerdə' : 'Всё необходимое для абитуриентов в одном месте'}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to={f.path}
                  className="group block glass rounded-2xl p-6 hover-lift border border-white/5 hover:border-white/10 transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <div className="inline-flex items-center gap-1 text-sm text-blue-400 font-medium">
                    {lang === 'az' ? 'Keç' : 'Перейти'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('home_how_title')}</h2>
            <p className="text-gray-400">{lang === 'az' ? '4 addımda ixtisas seçiminizi tamamlayın' : 'Завершите выбор специальности за 4 шага'}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-6 border border-white/5 flex gap-4">
                <div className="text-4xl font-black gradient-text opacity-50 shrink-0 leading-none">{s.n}</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    <h3 className="font-bold text-white">{t(s.titleKey)}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{t(s.descKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="text-3xl shrink-0">⚠️</div>
              <div>
                <h3 className="font-bold text-amber-400 mb-2">
                  {lang === 'az' ? 'Vacib Qeyd' : 'Важное замечание'}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {lang === 'az'
                    ? <>2025-2026 keçid balları proqnoz xarakterlər daşıyır. Blok imtahanı iyun-iyulda keçirilir, nəticələr avqustda elan olunur. Rəsmi məlumat üçün <a href="https://dim.gov.az" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">dim.gov.az</a>-ı izləyin.</>
                    : <>Проходные баллы 2025-2026 носят прогнозный характер. Блок-экзамен проводится в июне-июле, результаты объявляются в августе. Для официальной информации следите за <a href="https://dim.gov.az" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">dim.gov.az</a>.</>
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-gray-500 text-sm">
            © 2026 DİM {lang === 'az' ? 'Qəbul Köməkçisi' : 'Помощник по поступлению'} —{' '}
            {lang === 'az' ? 'Rəsmi DİM saytı' : 'Официальный сайт DIM'}:{' '}
            <a href="https://dim.gov.az" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">dim.gov.az</a>
            {' · '}
            {lang === 'az' ? 'Şəxsi kabinet' : 'Личный кабинет'}:{' '}
            <a href="https://ekabinet.dim.gov.az" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ekabinet.dim.gov.az</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
