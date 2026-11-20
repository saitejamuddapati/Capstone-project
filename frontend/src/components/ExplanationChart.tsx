import React, { useState } from 'react';
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { ExplanationResult } from '../types';

interface ExplanationChartProps {
  explanation: ExplanationResult | null;
  classes: string[];
  currentCompareWith: string | null;
  onCompareWithChange: (targetDisease: string) => void;
  isLoading?: boolean;
}

export const ExplanationChart: React.FC<ExplanationChartProps> = ({
  explanation,
  classes,
  currentCompareWith,
  onCompareWithChange,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'scientific' | 'general'>('scientific');

  if (!explanation) {
    return null;
  }

  const {
    explained_class,
    compared_with,
    pushes_toward,
    pushes_against,
    not_tested,
    scientific_summary,
    general_summary,
    key_findings,
    questions_for_doctor,
  } = explanation;

  // Combine items and sort by absolute impact
  const allEvidence = [
    ...pushes_toward.map((item) => ({ ...item, direction: 'toward' as const })),
    ...pushes_against.map((item) => ({ ...item, direction: 'against' as const })),
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Determine maximum absolute impact for proportional bar scaling
  const maxAbsImpact = Math.max(
    ...allEvidence.map((e) => Math.abs(e.impact)),
    0.5
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-5">
      {/* Header, Tier Switcher and Comparison Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Pairwise Differential Contrast Evidence
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
              Exact Range-Aware Bayes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multiplicative likelihood ratios showing how each biomarker pushes toward{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{explained_class}</span> or{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{compared_with}</span>.
          </p>
        </div>

        {/* View Mode Toggle & Compare Selector */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto shrink-0">
          {/* Dual Explanation View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('scientific')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'scientific'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Scientific (Clinicians)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('general')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'general'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>General (Plain English)</span>
            </button>
          </div>

          {/* Compare with selector */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="compare-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              vs.
            </label>
            <select
              id="compare-select"
              value={currentCompareWith || compared_with}
              disabled={isLoading}
              onChange={(e) => onCompareWithChange(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {classes
                .filter((c) => c !== explained_class)
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Narrative Banner based on selected view mode */}
      {viewMode === 'scientific' ? (
        scientific_summary && (
          <div className="p-3.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-950 dark:text-teal-200 leading-relaxed space-y-1">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 text-[11px]">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Scientific Explanation &amp; Likelihood Ratio Analysis</span>
            </div>
            <p>{scientific_summary}</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {general_summary && (
            <div className="p-3.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 text-[11px]">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Plain-Language Summary for Patients &amp; Everyday Understanding</span>
              </div>
              <p>{general_summary}</p>
            </div>
          )}

          {key_findings && key_findings.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                Key Diagnostic Takeaways:
              </span>
              <ul className="space-y-1">
                {key_findings.map((f, i) => (
                  <li key={i} className="flex items-start space-x-1.5 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Axis Guide */}
      <div className="flex items-center justify-between text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Favours {compared_with}</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          {viewMode === 'scientific' ? 'Log Likelihood Ratio (0 = neutral)' : 'Evidence Direction'}
        </div>
        <div className="flex items-center space-x-1.5 text-teal-700 dark:text-teal-400">
          <span>Favours {explained_class}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Diverging Bar Chart Rows */}
      <div className="space-y-3.5 pt-1">
        {allEvidence.map((item) => {
          const isToward = item.direction === 'toward';
          const ratio = item.likelihood_ratio || Math.exp(item.impact);
          const barPct = (Math.abs(item.impact) / maxAbsImpact) * 50;

          const narrative = viewMode === 'scientific'
            ? (item.clinical_insight || (isToward
                ? `${item.feature} = ${item.value} → ${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)}× more likely under ${explained_class} than ${compared_with}`
                : `${item.feature} = ${item.value} → ${(ratio > 0 ? 1 / ratio : 1).toFixed(1)}× more likely under ${compared_with} than ${explained_class}`))
            : (item.plain_language || (isToward
                ? `Test result of ${item.value} supports ${explained_class}`
                : `Test result of ${item.value} leans toward ${compared_with}`));

          return (
            <div key={item.feature} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.feature}{' '}
                  <span className="font-normal text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    ({String(item.value)})
                  </span>
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 italic text-right max-w-[65%] truncate" title={narrative}>
                  {viewMode === 'scientific'
                    ? (isToward ? `+${item.impact.toFixed(2)} log-LR (${ratio.toFixed(1)}×)` : `${item.impact.toFixed(2)} log-LR (${(1/ratio).toFixed(1)}×)`)
                    : (isToward ? `Leans toward ${explained_class}` : `Leans toward ${compared_with}`)}
                </span>
              </div>

              {/* Diverging Bar Track */}
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded relative flex items-center overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 z-10" />

                {isToward ? (
                  <div
                    className="h-full bg-teal-600 dark:bg-teal-500 rounded-r transition-all duration-500"
                    style={{
                      marginLeft: '50%',
                      width: `${barPct}%`,
                    }}
                    title={`Log LR: +${item.impact.toFixed(3)}`}
                  />
                ) : (
                  <div
                    className="h-full bg-amber-600 dark:bg-amber-500 rounded-l transition-all duration-500 absolute"
                    style={{
                      right: '50%',
                      width: `${barPct}%`,
                    }}
                    title={`Log LR: ${item.impact.toFixed(3)}`}
                  />
                )}
              </div>

              {/* Detailed Narrative Sentence below the bar */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {narrative}
              </p>
            </div>
          );
        })}
      </div>

      {/* Questions for Doctor in Patient Mode */}
      {viewMode === 'general' && questions_for_doctor && questions_for_doctor.length > 0 && (
        <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs space-y-2">
          <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-violet-900 dark:text-violet-300 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Suggested Questions for Your Clinical Appointment:</span>
          </div>
          <ul className="space-y-1.5 pl-1">
            {questions_for_doctor.map((q, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-violet-900 dark:text-violet-200">
                <span className="font-bold text-violet-600 dark:text-violet-400">Q{idx + 1}:</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unmeasured Tests Chip List */}
      {not_tested && not_tested.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Not tested for this patient ({not_tested.length} tests omitted from Bayes product):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {not_tested.map((test) => (
              <span
                key={test}
                className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                {test}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
