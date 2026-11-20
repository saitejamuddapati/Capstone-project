import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Moon, Sun } from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const navItems = [
    { name: 'Diagnose', path: '/' },
    { name: 'Explanation', path: '/explanation' },
    { name: 'Batch', path: '/batch' },
    { name: 'Model Performance', path: '/performance' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <NavLink to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-teal-700 dark:bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-800 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                  RheumaAI
                </span>
                <span className="inline-flex items-center text-teal-700 dark:text-teal-300 font-bold text-[11px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 leading-none">
                  CDSS
                </span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 leading-tight">
                Differential Diagnosis Decision Support
              </span>
            </div>
          </NavLink>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => {
                const isExplanation = item.path === '/explanation';
                if (isActive) {
                  return isExplanation
                    ? 'px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-violet-50 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 shadow-xs'
                    : 'px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-teal-50 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 shadow-xs';
                }
                return isExplanation
                  ? 'px-3 py-1.5 rounded-md text-sm font-medium transition-all text-violet-700 hover:text-violet-900 hover:bg-violet-50 dark:text-violet-300 dark:hover:text-violet-100 dark:hover:bg-violet-950/60'
                  : 'px-3 py-1.5 rounded-md text-sm font-medium transition-all text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60';
              }}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Backend Status Dot */}
          <div
            className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={backendOnline === true ? "Backend connected (FastAPI :8000)" : backendOnline === false ? "Backend unreachable" : "Connecting..."}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : backendOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400 hidden sm:inline font-mono text-[11px]">
              {backendOnline === true ? 'Bayes Online' : backendOnline === false ? 'Offline' : 'Connecting'}
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800 space-x-2 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>
    </header>
  );
};
