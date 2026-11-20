import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { PredictionResult } from '../types';

interface StatusBannerProps {
  prediction: PredictionResult;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ prediction }) => {
  const { status, message, missing_tests } = prediction;

  if (status === 'confident') {
    return (
      <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start space-x-3.5 transition-all">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Confident Differential Suggestion
          </h4>
          <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5">
            Calibrated confidence meets or exceeds the safe decision-support threshold (66.7%).
          </p>
        </div>
      </div>
    );
  }

  if (status === 'needs_review') {
    return (
      <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start space-x-3.5 transition-all">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Needs Clinical Review – Confidence Below 66.7%
          </h4>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
            The differential is close between top candidates. Review antibody panel and consider recommended next tests below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-start space-x-3.5 transition-all">
      <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
          Insufficient Data – Enter At Least 3 Tests
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          {message || 'At least 3 of the 12 clinical tests (labs and antibodies) must be measured before generating differential diagnosis probabilities.'}
        </p>
        {missing_tests && missing_tests.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1 self-center">
              Unmeasured tests ({missing_tests.length}):
            </span>
            {missing_tests.slice(0, 6).map((test) => (
              <span
                key={test}
                className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                {test}
              </span>
            ))}
            {missing_tests.length > 6 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{missing_tests.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
