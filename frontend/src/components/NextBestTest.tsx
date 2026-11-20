import React from 'react';
import { Sparkles } from 'lucide-react';
import { RecommendationItem } from '../types';

interface NextBestTestProps {
  recommendations: RecommendationItem[];
  onSimulateTest: (testName: string, value: any) => void;
}

export const NextBestTest: React.FC<NextBestTestProps> = ({
  recommendations,
  onSimulateTest,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const allZeroChance = recommendations.every(
    (r) => r.chance_of_confident_answer <= 0.001
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Next-Best-Test Recommendation
        </h3>
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Ranked by Information Gain
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Suggests which unmeasured test would most likely settle diagnostic uncertainty and reach the confident threshold (≥66.7%).
      </p>

      {allZeroChance ? (
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          No single missing test is likely to settle this case; comprehensive clinical assessment and longitudinal monitoring are needed.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((item, idx) => {
            const chancePct = Math.round(item.chance_of_confident_answer * 100);
            const expectedPct = Math.round(item.expected_confidence_after * 100);
            const isAntibody = [
              'HLA-B27',
              'ANA',
              'Anti-Ro',
              'Anti-La',
              'Anti-dsDNA',
              'Anti-Sm',
            ].includes(item.test);

            return (
              <div
                key={item.test}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                      {item.test}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {chancePct}% chance
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      of confident answer
                    </span>
                  </div>
                </div>

                {/* Progress bar of confident answer chance */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(chancePct, 4)}%` }}
                  />
                </div>

                {/* Expected confidence metric & simulation helper */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 text-xs gap-2">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Expected confidence afterwards: <strong className="font-semibold text-slate-800 dark:text-slate-200">{expectedPct}%</strong> (from {Math.round(item.current_confidence * 100)}%)
                  </span>

                  {/* Try this result helper */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Demo simulation:</span>
                    {isAntibody ? (
                      <>
                        <button
                          onClick={() => onSimulateTest(item.test, 'Positive')}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
                          title="Simulate this antibody as Positive"
                        >
                          + Pos
                        </button>
                        <button
                          onClick={() => onSimulateTest(item.test, 'Negative')}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          title="Simulate this antibody as Negative"
                        >
                          - Neg
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          // Suggest typical value based on test
                          const defaults: Record<string, number> = {
                            ESR: 25.0,
                            CRP: 15.0,
                            RF: 20.0,
                            'Anti-CCP': 20.0,
                            C3: 130.0,
                            C4: 40.0,
                          };
                          onSimulateTest(item.test, defaults[item.test] || 15.0);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
                      >
                        Try simulated value
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
