import { AlertTriangle, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Clinical Disclaimer Alert Banner */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 flex items-start space-x-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed">
            <strong className="font-semibold text-amber-950 dark:text-amber-100 block sm:inline mr-1">
              Clinical Disclaimer:
            </strong>
            Decision support for research and education only. A model prediction is not a diagnosis; a qualified clinician must make the final clinical decision. Missing tests are never imputed or defaulted.
          </div>
        </div>

        {/* Project & Academic Meta */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4 pt-2">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Capstone Project: Explainable AI for Early Differential Diagnosis of Rheumatic and Autoimmune Diseases
            </p>
            <p>
              Team: M. Sai Teja (ML), V. Jahnavi Sai (Data), B. Varsha Sree (XAI & Eval), G. Jaswa Preethi (Backend & UI)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-center md:text-right">
            <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Guide: Dr. Sandipan Maiti · Dept. of CSE · VIT-AP University (2026–27)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
