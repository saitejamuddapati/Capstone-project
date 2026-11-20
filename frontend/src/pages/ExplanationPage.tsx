import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Info,
  RefreshCw,
  HelpCircle,
  GitCompare,
  Stethoscope,
  AlertTriangle,
  ChevronDown,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { AnalysisResponse, ModelInfo, PatientInput, ExplanationResult } from '../types';
import { HistoryItem } from '../components/SessionHistory';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const SHORT_NAMES: Record<string, string> = {
  'Ankylosing Spondylitis': 'AS',
  Normal: 'Normal',
  'Psoriatic Arthritis': 'PsA',
  'Reactive Arthritis': 'ReA',
  'Rheumatoid Arthritis': 'RA',
  "Sjögren's Syndrome": 'Sjogren',
  'Systemic Lupus Erythematosus': 'SLE',
};

const DISEASE_COLORS: Record<string, string> = {
  'Ankylosing Spondylitis': '#7c3aed',
  Normal: '#16a34a',
  'Psoriatic Arthritis': '#b45309',
  'Reactive Arthritis': '#c2410c',
  'Rheumatoid Arthritis': '#0f766e',
  "Sjögren's Syndrome": '#1d4ed8',
  'Systemic Lupus Erythematosus': '#be185d',
};

const DISEASE_DESCRIPTIONS: Record<string, string> = {
  'Ankylosing Spondylitis':
    'A chronic inflammatory arthritis primarily affecting the spine and sacroiliac joints. Strongly associated with HLA-B27.',
  Normal: 'No significant autoimmune or rheumatic disease pattern detected within tested parameters.',
  'Psoriatic Arthritis':
    'An inflammatory arthritis associated with psoriasis. Can affect peripheral joints and/or the axial skeleton.',
  'Reactive Arthritis':
    'Joint inflammation triggered by infection elsewhere in the body. HLA-B27 is present in ~50–80% of cases.',
  'Rheumatoid Arthritis':
    'Chronic symmetric inflammatory polyarthritis. Characterised by elevated RF and Anti-CCP antibodies.',
  "Sjögren's Syndrome":
    'Autoimmune disease targeting exocrine glands. High ANA, Anti-Ro (SSA), and Anti-La (SSB) are hallmarks.',
  'Systemic Lupus Erythematosus':
    'Systemic autoimmune disease. Anti-dsDNA and Anti-Sm are highly specific; complement (C3/C4) often low.',
};

function formatPct(v: number | null | undefined): string {
  if (v == null) return '–';
  return `${(v * 100).toFixed(1)}%`;
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

/** Diverging bar chart for a single ExplanationResult with Scientific & General views */
function EvidenceChart({
  explanation,
  title,
  accentColor = '#0f766e',
  viewTier = 'scientific',
}: {
  explanation: ExplanationResult;
  title: string;
  accentColor?: string;
  viewTier?: 'scientific' | 'general';
}) {
  const {
    explained_class,
    compared_with,
    pushes_toward,
    pushes_against,
    not_tested,
    scientific_summary,
    general_summary,
    key_findings,
    questions_for_doctor
  } = explanation;

  const allEvidence = [
    ...pushes_toward.map((item) => ({ ...item, direction: 'toward' as const })),
    ...pushes_against.map((item) => ({ ...item, direction: 'against' as const })),
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const maxAbsImpact = Math.max(...allEvidence.map((e) => Math.abs(e.impact)), 0.5);

  if (allEvidence.length === 0) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
        No measured tests to display evidence for.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <span className="text-[11px] font-medium text-slate-400">
          Showing {viewTier === 'scientific' ? 'Exact Bayes Log-Likelihood Ratios' : 'Plain Language Biomarker Insights'}
        </span>
      </div>

      {/* Narrative Alert Box */}
      {viewTier === 'scientific' ? (
        scientific_summary && (
          <div className="p-3.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-950 dark:text-teal-200 leading-relaxed space-y-1">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 text-[11px]">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Scientific Pathophysiology &amp; Likelihood Ratio Analysis:</span>
            </div>
            <p>{scientific_summary}</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {general_summary && (
            <div className="p-3.5 rounded-lg bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 text-[11px]">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>What This Means For You (Plain English):</span>
              </div>
              <p>{general_summary}</p>
            </div>
          )}

          {key_findings && key_findings.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                Summary of Findings:
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

      {/* Axis guide */}
      <div className="flex items-center justify-between text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-1 text-amber-700 dark:text-amber-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Favours {SHORT_NAMES[compared_with] || compared_with}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          {viewTier === 'scientific' ? 'Log Likelihood Ratio (0 = neutral)' : 'Evidence Direction'}
        </span>
        <div className="flex items-center space-x-1 dark:text-teal-400" style={{ color: accentColor }}>
          <span>Favours {SHORT_NAMES[explained_class] || explained_class}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3.5">
        {allEvidence.map((item) => {
          const isToward = item.direction === 'toward';
          const ratio = item.likelihood_ratio || Math.exp(item.impact);
          const barPct = (Math.abs(item.impact) / maxAbsImpact) * 50;

          const narrative = viewTier === 'scientific'
            ? (item.clinical_insight || (isToward
                ? `${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)}× more likely under ${SHORT_NAMES[explained_class] || explained_class}`
                : `${(ratio > 0 ? 1 / ratio : 1).toFixed(1)}× more likely under ${SHORT_NAMES[compared_with] || compared_with}`))
            : (item.plain_language || (isToward
                ? `Test result of ${item.value} leans toward ${explained_class}`
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
                <span className="text-[11px] text-slate-500 dark:text-slate-400 italic max-w-[55%] text-right truncate">
                  {viewTier === 'scientific'
                    ? (isToward ? `+${item.impact.toFixed(2)} log-LR (${ratio.toFixed(1)}×)` : `${item.impact.toFixed(2)} log-LR (${(1/ratio).toFixed(1)}×)`)
                    : (isToward ? `Points toward ${SHORT_NAMES[explained_class] || explained_class}` : `Points toward ${SHORT_NAMES[compared_with] || compared_with}`)}
                </span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded relative flex items-center overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 z-10" />
                {isToward ? (
                  <div
                    className="h-full rounded-r transition-all duration-500"
                    style={{ marginLeft: '50%', width: `${barPct}%`, backgroundColor: accentColor }}
                    title={`Log LR: +${item.impact.toFixed(3)}`}
                  />
                ) : (
                  <div
                    className="h-full bg-amber-500 rounded-l transition-all duration-500 absolute"
                    style={{ right: '50%', width: `${barPct}%` }}
                    title={`Log LR: ${item.impact.toFixed(3)}`}
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {narrative}
              </p>
            </div>
          );
        })}
      </div>

      {/* Questions for Doctor in Patient Mode */}
      {viewTier === 'general' && questions_for_doctor && questions_for_doctor.length > 0 && (
        <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs space-y-2 mt-4">
          <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-violet-900 dark:text-violet-300 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Questions You Can Ask Your Doctor:</span>
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

      {/* Not tested */}
      {not_tested && not_tested.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Not tested ({not_tested.length}): evidence omitted</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {not_tested.map((test) => (
              <span
                key={test}
                className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                {test}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main ExplanationPage                                                       */
/* -------------------------------------------------------------------------- */

export const ExplanationPage: React.FC = () => {
  const [_modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [viewTier, setViewTier] = useState<'scientific' | 'general'>('scientific');

  /* ---- Source selection (from session history or manual patient run) ---- */
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('rheuma_analysis_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /* ---- Disease-level Explanation panel ---- */
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResponse | null>(null);
  const [activePatient, setActivePatient] = useState<PatientInput | null>(null);

  /* The explanation shown is the main one from the active analysis */
  const mainExplanation = activeAnalysis?.explanation ?? null;

  /* ---- Comparison panel ---- */
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [compareMode, setCompareMode] = useState<'default' | 'sensitive'>('default');
  const [compExplanation, setCompExplanation] = useState<ExplanationResult | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);

  /* ---- Load a history item into the active analysis ---- */
  const loadHistoryItem = useCallback((item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setActiveAnalysis(item.response);
    setActivePatient(item.patient);
    if (item.response.prediction.predicted_disease) {
      setCompareA(item.response.prediction.predicted_disease);
    }
    if (item.response.prediction.runner_up) {
      setCompareB(item.response.prediction.runner_up);
    }
  }, []);

  /* Auto-select first history item if available and none selected */
  useEffect(() => {
    if (!selectedHistoryId && history.length > 0) {
      loadHistoryItem(history[0]);
    }
  }, [history, selectedHistoryId, loadHistoryItem]);

  /* ---- Load model info ---- */
  useEffect(() => {
    api.getModelInfo().then((info) => {
      setModelInfo(info);
      setClasses(info.classes);
      if (info.classes.length >= 2 && !compareA) {
        setCompareA(info.classes[0]);
        setCompareB(info.classes[1]);
      }
    });
  }, [compareA]);

  /* ---- Sync session history from sessionStorage changes ---- */
  useEffect(() => {
    const sync = () => {
      try {
        const saved = sessionStorage.getItem('rheuma_analysis_history');
        setHistory(saved ? JSON.parse(saved) : []);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  /* ---- Run comparison: fetch explanation for compareA vs compareB ---- */
  const runComparison = useCallback(async () => {
    if (!compareA || !compareB || compareA === compareB) return;
    const patient = activePatient;
    if (!patient) {
      setCompError('Load a patient result from the session history first.');
      return;
    }
    setCompLoading(true);
    setCompError(null);
    try {
      // Pass compareB as reference and compareA as targetClass
      const result = await api.explain(patient, compareB, 12, compareA);
      if ('status' in result && result.status === 'insufficient_data') {
        setCompError((result as any).message || 'Insufficient data for explanation.');
      } else {
        setCompExplanation(result as ExplanationResult);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setCompError(err.detail);
      } else {
        setCompError('Backend unreachable.');
      }
    } finally {
      setCompLoading(false);
    }
  }, [compareA, compareB, activePatient]);

  const predictedDisease = activeAnalysis?.prediction.predicted_disease;
  const confidence = activeAnalysis?.prediction.confidence;
  const probabilities = activeAnalysis?.prediction.probabilities;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header with Dual View Toggle                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <FlaskConical className="w-6 h-6 text-teal-700 dark:text-teal-400" />
            <span>Explanation &amp; Comparison Centre</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Exact likelihood-ratio explanations for clinicians, with plain-language translations for patients.
          </p>
        </div>

        {/* Global Explanation View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
          <button
            onClick={() => setViewTier('scientific')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewTier === 'scientific'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor / Scientific View</span>
          </button>
          <button
            onClick={() => setViewTier('general')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewTier === 'general'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Patient / Plain English</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Layout: History sidebar + Main content                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ===== LEFT: Session History Picker ============================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center space-x-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Session History</span>
            </h2>

            {history.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center space-y-1">
                <p>No analyses yet.</p>
                <p>Run a diagnosis on the <strong>Diagnose</strong> page first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                      selectedHistoryId === item.id
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-400 dark:border-teal-700 text-teal-900 dark:text-teal-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold truncate">{item.disease}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>{(item.confidence * 100).toFixed(1)}% confidence</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Probability distribution pill-bar */}
          {probabilities && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Probability Distribution</span>
              </h2>
              {Object.entries(probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([disease, prob]) => (
                  <div key={disease}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span
                        className="font-medium"
                        style={{ color: DISEASE_COLORS[disease] || '#475569' }}
                      >
                        {SHORT_NAMES[disease] || disease}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {formatPct(prob)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(prob * 100).toFixed(1)}%`,
                          backgroundColor: DISEASE_COLORS[disease] || '#475569',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ===== RIGHT: Explanation Panels ================================ */}
        <div className="lg:col-span-9 space-y-6">

          {/* ---- Predicted Disease Explanation Card ---- */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Card header */}
            <div
              className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800"
              style={{
                background: predictedDisease
                  ? `linear-gradient(135deg, ${DISEASE_COLORS[predictedDisease] || '#0f766e'}18 0%, transparent 70%)`
                  : undefined,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <FlaskConical className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Predicted Disease Explanation
                    </h2>
                  </div>
                  {predictedDisease ? (
                    <div className="flex items-baseline space-x-2">
                      <span
                        className="text-2xl font-extrabold tracking-tight"
                        style={{ color: DISEASE_COLORS[predictedDisease] || '#0f766e' }}
                      >
                        {predictedDisease}
                      </span>
                      <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                        ({SHORT_NAMES[predictedDisease] || ''})
                      </span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        · {formatPct(confidence)} confident
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Select a result from session history to see the explanation.
                    </p>
                  )}
                </div>
              </div>

              {/* Disease description */}
              {predictedDisease && DISEASE_DESCRIPTIONS[predictedDisease] && (
                <div className="mt-3 flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
                  <span>{DISEASE_DESCRIPTIONS[predictedDisease]}</span>
                </div>
              )}
            </div>

            {/* Card body – evidence chart */}
            <div className="p-4 sm:p-5">
              {!activeAnalysis ? (
                <div className="py-12 text-center space-y-3">
                  <Stethoscope className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No result loaded yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Go to the <strong>Diagnose</strong> page, run an analysis, then select it from the history panel on the left.
                  </p>
                </div>
              ) : mainExplanation ? (
                <EvidenceChart
                  explanation={mainExplanation}
                  title={`Evidence: Why ${predictedDisease} vs. ${mainExplanation.compared_with}`}
                  accentColor={DISEASE_COLORS[predictedDisease || ''] || '#0f766e'}
                  viewTier={viewTier}
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  Explanation not available for this result (insufficient data or no measured tests).
                </div>
              )}
            </div>
          </div>

          {/* ---- Comparison Panel ---- */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Card header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-violet-50/60 dark:from-violet-950/30 to-transparent">
              <div className="flex items-center space-x-2 mb-1">
                <GitCompare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Custom Disease Comparison Panel
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare any two diseases side-by-side to discover the exact discriminant evidence for this patient.
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* Comparison controls */}
              <div className="flex flex-wrap items-end gap-3">
                {/* Disease A */}
                <div className="flex flex-col space-y-1 min-w-[180px]">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Explain (Disease A)
                  </label>
                  <div className="relative">
                    <select
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                      className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 pr-8 appearance-none focus:ring-2 focus:ring-violet-500"
                    >
                      {classes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 pb-2">vs.</div>

                {/* Disease B */}
                <div className="flex flex-col space-y-1 min-w-[180px]">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Compare Against (Disease B)
                  </label>
                  <div className="relative">
                    <select
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                      className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 pr-8 appearance-none focus:ring-2 focus:ring-violet-500"
                    >
                      {classes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Mode */}
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mode</label>
                  <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                    {(['default', 'sensitive'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setCompareMode(m)}
                        className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                          compareMode === m
                            ? 'bg-white dark:bg-slate-700 text-violet-800 dark:text-violet-300 font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Run button */}
                <button
                  onClick={runComparison}
                  disabled={compLoading || !activePatient || compareA === compareB}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition-all ${
                    compLoading || !activePatient || compareA === compareB
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer'
                  }`}
                  title={!activePatient ? 'Load a patient from history first' : ''}
                >
                  {compLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Comparing...</span>
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Run Comparison</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error */}
              {compError && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{compError}</span>
                </div>
              )}

              {/* Warning if same disease selected */}
              {compareA === compareB && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Disease A and Disease B must be different to generate a comparison.</span>
                </div>
              )}

              {/* No patient loaded */}
              {!activePatient && !compError && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                  <span>
                    Select a past result from the <strong>Session History</strong> panel on the left to enable comparison. The comparison uses the same patient values.
                  </span>
                </div>
              )}

              {/* Side-by-side comparison result */}
              {compExplanation && !compLoading && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Header summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div
                      className="flex-1 p-3 rounded-lg border text-center"
                      style={{
                        borderColor: DISEASE_COLORS[compExplanation.explained_class] || '#6366f1',
                        background: `${DISEASE_COLORS[compExplanation.explained_class] || '#6366f1'}15`,
                      }}
                    >
                      <div
                        className="text-lg font-extrabold"
                        style={{ color: DISEASE_COLORS[compExplanation.explained_class] || '#6366f1' }}
                      >
                        {compExplanation.explained_class}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Posterior: {formatPct(compExplanation.probability)}
                      </div>
                    </div>

                    <div className="text-slate-400 dark:text-slate-500 text-xl font-bold text-center">vs.</div>

                    <div
                      className="flex-1 p-3 rounded-lg border text-center"
                      style={{
                        borderColor: DISEASE_COLORS[compExplanation.compared_with] || '#b45309',
                        background: `${DISEASE_COLORS[compExplanation.compared_with] || '#b45309'}15`,
                      }}
                    >
                      <div
                        className="text-lg font-extrabold"
                        style={{ color: DISEASE_COLORS[compExplanation.compared_with] || '#b45309' }}
                      >
                        {compExplanation.compared_with}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Posterior: {formatPct(compExplanation.probability_compared)}
                      </div>
                    </div>
                  </div>

                  <EvidenceChart
                    explanation={compExplanation}
                    title="Evidence distinguishing the two diseases for this patient"
                    accentColor={DISEASE_COLORS[compExplanation.explained_class] || '#6366f1'}
                    viewTier={viewTier}
                  />
                </div>
              )}

              {/* Skeleton loading */}
              {compLoading && (
                <div className="space-y-3 pt-2 animate-pulse">
                  <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-1">
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---- Disease Reference Guide ---- */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Disease Quick Reference</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(DISEASE_DESCRIPTIONS).map(([disease, desc]) => (
                <div
                  key={disease}
                  className="p-3 rounded-lg border text-xs"
                  style={{
                    borderColor: `${DISEASE_COLORS[disease] || '#475569'}40`,
                    background: `${DISEASE_COLORS[disease] || '#475569'}08`,
                  }}
                >
                  <div
                    className="font-bold mb-1"
                    style={{ color: DISEASE_COLORS[disease] || '#475569' }}
                  >
                    {disease}{' '}
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      ({SHORT_NAMES[disease]})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
