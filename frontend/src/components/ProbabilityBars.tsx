import React from 'react';
import { formatProbability } from '../utils/formatters';

interface ProbabilityBarsProps {
  probabilities: Record<string, number> | null;
  predictedDisease: string | null;
  threshold?: number;
}

const SHORT_NAMES: Record<string, string> = {
  'Ankylosing Spondylitis': 'AS',
  'Normal': 'Normal',
  'Psoriatic Arthritis': 'PsA',
  'Reactive Arthritis': 'ReA',
  'Rheumatoid Arthritis': 'RA',
  "Sjögren's Syndrome": 'Sjogren',
  'Systemic Lupus Erythematosus': 'SLE',
};

export const ProbabilityBars: React.FC<ProbabilityBarsProps> = ({
  probabilities,
  predictedDisease,
  threshold = 0.6666,
}) => {
  if (!probabilities) {
    return null;
  }

  // Sort entries descending by probability
  const sortedEntries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Calibrated Disease Probabilities
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Temperature-calibrated posterior probabilities (T = 1.069, ECE = 0.015)
          </p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-teal-500 inline-block" />
          <span>66.7% Threshold</span>
        </div>
      </div>

      <div className="space-y-3 relative pt-2">
        {/* Dashed vertical marker for 66.7% threshold */}
        <div
          className="absolute top-0 bottom-0 border-r-2 border-dashed border-teal-500/60 dark:border-teal-400/50 pointer-events-none z-10 hidden sm:block"
          style={{ left: `${threshold * 100}%` }}
          title="Safe Mode Confidence Threshold (66.7%)"
        >
          <span className="absolute -top-3.5 -translate-x-1/2 text-[10px] font-mono text-teal-700 dark:text-teal-400 font-semibold px-1 py-0.2 rounded bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800">
            66.7%
          </span>
        </div>

        {sortedEntries.map(([disease, prob]) => {
          const isTop = disease === predictedDisease;
          const pctWidth = Math.min(Math.max(prob * 100, 1.5), 100);
          const shortName = SHORT_NAMES[disease] || disease;

          return (
            <div key={disease} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-medium truncate pr-2 ${
                    isTop
                      ? 'text-teal-900 dark:text-teal-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  title={disease}
                >
                  {disease} <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">({shortName})</span>
                </span>
                <span
                  className={`font-mono text-xs font-semibold ${
                    isTop
                      ? 'text-teal-700 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {formatProbability(prob)}
                </span>
              </div>

              {/* Progress bar container */}
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTop
                      ? 'bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-500 dark:to-teal-400'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  style={{ width: `${pctWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
