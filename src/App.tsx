import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SpecialtyWizard from './pages/SpecialtyWizard';
import ScoreCalculator from './pages/ScoreCalculator';
import UniversitiesPage from './pages/UniversitiesPage';
import CollegesPage from './pages/CollegesPage';
import ExamCalendar from './pages/ExamCalendar';
import FavoritesPage from './pages/FavoritesPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import ComparisonModal from './components/ComparisonModal';
import AuthModal from './components/AuthModal';

import { LanguageProvider } from './context/LanguageContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <ComparisonProvider>
            <HashRouter>
              <div className="min-h-screen" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                <Header />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/axtaris" element={<GlobalSearchPage />} />
                  <Route path="/ixtilas-secimi" element={<SpecialtyWizard />} />
                  <Route path="/kalkulyator" element={<ScoreCalculator />} />
                  <Route path="/universitetler" element={<UniversitiesPage />} />
                  <Route path="/kollecler" element={<CollegesPage />} />
                  <Route path="/teqvim" element={<ExamCalendar />} />
                  <Route path="/favoritler" element={<FavoritesPage />} />
                </Routes>
                {/* Global overlays */}
                <ComparisonModal />
                <AuthModal />
              </div>
            </HashRouter>
          </ComparisonProvider>
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
