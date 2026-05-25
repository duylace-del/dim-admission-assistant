import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, Calculator, BookOpen, Building2, School, Calendar, Settings, Heart, Search, Bell, LogOut, BarChart2 } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useComparison } from '../context/ComparisonContext';
import { useAuth } from '../context/AuthContext';
import NotifyModal from './NotifyModal';

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { favorites } = useFavorites();
  const { items: cmpItems, setShowModal } = useComparison();
  const { user, logout, setShowAuthModal, setAuthMode } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navItems = [
    { path: '/', label: t('nav_home'), icon: <GraduationCap size={14} /> },
    { path: '/axtaris', label: t('nav_search'), icon: <Search size={14} /> },
    { path: '/ixtilas-secimi', label: t('nav_specialty'), icon: <BookOpen size={14} /> },
    { path: '/kalkulyator', label: t('nav_calculator'), icon: <Calculator size={14} /> },
    { path: '/universitetler', label: t('nav_universities'), icon: <Building2 size={14} /> },
    { path: '/kollecler', label: t('nav_colleges'), icon: <School size={14} /> },
    { path: '/teqvim', label: t('nav_calendar'), icon: <Calendar size={14} /> },
    { path: '/admin', label: t('nav_admin'), icon: <Settings size={14} /> },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-2 shadow-2xl' : 'py-3 bg-transparent backdrop-blur-sm border-b border-white/5'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-base leading-none gradient-text">DİM Köməkçi</div>
              <div className="text-xs text-gray-400">2025-2026</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 shrink-0">

            {/* ─── Language Switcher: two visible buttons ─── */}
            <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setLang('az')}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
                  lang === 'az'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Azərbaycan dili"
              >
                🇦🇿 AZ
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={() => setLang('ru')}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
                  lang === 'ru'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Русский язык"
              >
                🇷🇺 RU
              </button>
            </div>

            {/* Notify Bell */}
            <button
              onClick={() => setNotifyOpen(true)}
              className="glass p-1.5 rounded-lg text-gray-400 hover:text-amber-400 border border-white/10 hover:border-amber-500/30 transition-all"
              title={t('notify_bell')}
            >
              <Bell size={15} />
            </button>

            {/* Favorites */}
            <Link
              to="/favoritler"
              className={`relative glass p-1.5 rounded-lg border transition-all ${
                favorites.length > 0
                  ? 'text-pink-400 border-pink-500/30 bg-pink-500/10'
                  : 'text-gray-400 border-white/10 hover:text-pink-400 hover:border-pink-500/30'
              }`}
              title={t('favorites_title')}
            >
              <Heart size={15} fill={favorites.length > 0 ? 'currentColor' : 'none'} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
            </Link>

            {/* Comparison */}
            {cmpItems.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="relative glass p-1.5 rounded-lg text-blue-400 border border-blue-500/30 bg-blue-500/10"
                title={t('compare_title')}
              >
                <BarChart2 size={15} />
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cmpItems.length}
                </span>
              </button>
            )}

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 glass px-2 py-1.5 rounded-lg text-xs text-gray-300 border border-white/10 hover:text-white hover:border-white/20 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.username}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 glass-strong rounded-xl border border-white/10 p-2 min-w-40 shadow-xl z-50">
                    <div className="text-xs text-gray-500 px-2 py-1 border-b border-white/10 mb-1 truncate">{user.email}</div>
                    <Link to="/favoritler" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Heart size={13} /> {t('saved_favorites')}
                    </Link>
                    <button onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <LogOut size={13} /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="glass px-2.5 py-1.5 rounded-lg text-xs text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 transition-all font-medium"
              >
                {t('login')}
              </button>
            )}

            {/* Mobile Toggle */}
            <button
              className="xl:hidden p-1.5 rounded-lg glass text-gray-300 hover:text-white border border-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="xl:hidden bg-[#0a1628] mt-2 mx-4 rounded-2xl p-3 border border-white/10 shadow-2xl">
            {/* Lang switcher mobile */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/8">
              <span className="text-xs text-gray-400">{lang === 'az' ? 'Dil:' : 'Язык:'}</span>
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button onClick={() => setLang('az')}
                  className={`px-3 py-1 text-xs font-bold transition-all ${lang === 'az' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  🇦🇿 AZ
                </button>
                <div className="w-px bg-white/10" />
                <button onClick={() => setLang('ru')}
                  className={`px-3 py-1 text-xs font-bold transition-all ${lang === 'ru' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  🇷🇺 RU
                </button>
              </div>
            </div>
            <nav className="grid grid-cols-2 gap-1.5">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    location.pathname === item.path
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-xs">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <NotifyModal open={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </>
  );
}
