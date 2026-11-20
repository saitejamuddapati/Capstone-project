import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DiagnosePage } from './pages/DiagnosePage';

// Lazy-load non-index routes for faster initial page load performance
const ExplanationPage = lazy(() => import('./pages/ExplanationPage').then(m => ({ default: m.ExplanationPage })));
const BatchPage = lazy(() => import('./pages/BatchPage').then(m => ({ default: m.BatchPage })));
const PerformancePage = lazy(() => import('./pages/PerformancePage').then(m => ({ default: m.PerformancePage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));

const PageFallback: React.FC = () => (
  <div className="py-20 flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-500 font-medium">Loading clinical module...</span>
  </div>
);

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rheuma_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('rheuma_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('rheuma_theme', 'light');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
            <Route index element={<DiagnosePage />} />
            <Route path="explanation" element={<ExplanationPage />} />
            <Route path="batch" element={<BatchPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
