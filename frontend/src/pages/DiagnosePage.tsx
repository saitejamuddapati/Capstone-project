import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  RotateCcw,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Stethoscope,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import {
  PatientInput,
  AnalysisResponse,
  SamplePatient,
  ModelInfo,
} from '../types';
import { StatusBanner } from '../components/StatusBanner';
import { ProbabilityBars } from '../components/ProbabilityBars';
import { DiseaseEvidenceCard } from '../components/DiseaseEvidenceCard';
import { NextBestTest } from '../components/NextBestTest';
import { SessionHistory, HistoryItem } from '../components/SessionHistory';
import { countMeasuredTests, formatProbability } from '../utils/formatters';

const TRAINING_RANGES: Record<string, [number, number]> = {
  Age: [20, 80],
  ESR: [0, 49],
  CRP: [0.1, 30],
  RF: [0, 40],
  'Anti-CCP': [0, 40],
  C3: [50, 205],
  C4: [5, 74],
};

const SHORT_NAMES: Record<string, string> = {
  'Ankylosing Spondylitis': 'AS',
  'Normal': 'Normal',
  'Psoriatic Arthritis': 'PsA',
  'Reactive Arthritis': 'ReA',
  'Rheumatoid Arthritis': 'RA',
  "Sjögren's Syndrome": 'Sjogren',
  'Systemic Lupus Erythematosus': 'SLE',
};

const SAMPLE_DESCRIPTIONS: Record<number, string> = {
  0: 'Sample 1 – Ankylosing Spondylitis (HLA-B27 positive)',
  1: 'Sample 2 – Ankylosing Spondylitis (partial panel)',
  2: 'Sample 3 – Healthy control (borderline normal)',
  3: 'Sample 4 – Normal control (atypical antibodies)',
  4: 'Sample 5 – Psoriatic Arthritis (elevated ESR/CRP)',
  5: 'Sample 6 – Psoriatic Arthritis (HLA-B27 positive)',
  6: 'Sample 7 – Reactive Arthritis (HLA-B27, triggers sensitivity switch)',
  7: 'Sample 8 – Reactive Arthritis (classic presentation)',
  8: 'Sample 9 – Rheumatoid Arthritis (high RF & Anti-CCP)',
  9: 'Sample 10 – Rheumatoid Arthritis (moderate titers)',
  10: 'Sample 11 – Sjögren’s Syndrome (high ANA, SSA, SSB)',
  11: 'Sample 12 – Sjögren’s Syndrome (subtle serology)',
  12: 'Sample 13 – Systemic Lupus Erythematosus (Anti-dsDNA, Anti-Sm)',
  13: 'Sample 14 – Systemic Lupus Erythematosus (hypocomplementemia)',
};

const INITIAL_PATIENT: PatientInput = {
  Age: null,
  Gender: null,
  ESR: null,
  CRP: null,
  RF: null,
  'Anti-CCP': null,
  'HLA-B27': null,
  ANA: null,
  'Anti-Ro': null,
  'Anti-La': null,
  'Anti-dsDNA': null,
  'Anti-Sm': null,
  C3: null,
  C4: null,
};

export const DiagnosePage: React.FC = () => {
  const [patient, setPatient] = useState<PatientInput>(INITIAL_PATIENT);
  const [mode, setMode] = useState<'default' | 'sensitive'>('default');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const [samples, setSamples] = useState<SamplePatient[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [currentCompareWith, setCurrentCompareWith] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Session history
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('rheuma_analysis_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history on changes
  useEffect(() => {
    try {
      sessionStorage.setItem('rheuma_analysis_history', JSON.stringify(history));
    } catch {
      // Ignore quota errors
    }
  }, [history]);

  // Load samples and model info
  useEffect(() => {
    api.getModelInfo()
      .then(setModelInfo)
      .catch((err) => console.error('Failed to load model info', err));

    api.getSamplePatients()
      .then(setSamples)
      .catch((err) => console.error('Failed to load sample patients', err));
  }, []);

  const measuredCount = useMemo(() => countMeasuredTests(patient), [patient]);
  const canAnalyze = measuredCount >= 3;

  // Handle number input changes
  const handleNumberChange = (field: keyof PatientInput, rawValue: string) => {
    setSelectedSampleIndex(null);
    if (rawValue.trim() === '') {
      setPatient((prev) => ({ ...prev, [field]: null }));
      return;
    }
    const parsed = parseFloat(rawValue);
    setPatient((prev) => ({ ...prev, [field]: isNaN(parsed) ? rawValue : parsed }));
  };

  // Handle antibody segmented control changes
  const handleAntibodyChange = (field: keyof PatientInput, state: 'Positive' | 'Negative' | 'Not tested') => {
    setSelectedSampleIndex(null);
    setPatient((prev) => ({
      ...prev,
      [field]: state === 'Not tested' ? null : state,
    }));
  };

  // Load sample patient
  const handleSelectSample = (indexStr: string) => {
    if (indexStr === '') {
      setSelectedSampleIndex(null);
      return;
    }
    const idx = parseInt(indexStr, 10);
    const sample = samples[idx];
    if (sample) {
      setSelectedSampleIndex(idx);
      setPatient({ ...sample.patient });
      // Reset analysis till user hits Analyze or auto-analyze
      runAnalysis({ ...sample.patient }, mode, null);
    }
  };

  // Run analysis
  const runAnalysis = async (
    targetPatient: PatientInput = patient,
    targetMode: 'default' | 'sensitive' = mode,
    compareWith: string | null = currentCompareWith
  ) => {
    setLoading(true);
    setBackendError(null);
    try {
      const res = await api.analyze(targetPatient, targetMode, compareWith);
      setAnalysis(res);
      setCurrentCompareWith(compareWith || res.prediction.runner_up);

      // Add to session history if valid prediction
      if (res.prediction.status !== 'insufficient_data' && res.prediction.predicted_disease) {
        const item: HistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          disease: res.prediction.predicted_disease,
          status: res.prediction.status,
          confidence: res.prediction.confidence || 0,
          mode: targetMode,
          patient: { ...targetPatient },
          response: res,
        };
        setHistory((prev) => [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 10));
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setBackendError(err.detail);
      } else {
        setBackendError(
          'Backend is not reachable on port 8000. Please start the backend service using start_dev or uvicorn.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setPatient(INITIAL_PATIENT);
    setSelectedSampleIndex(null);
    setAnalysis(null);
    setCurrentCompareWith(null);
    setBackendError(null);
  };

  // Simulate missing test helper
  const handleSimulateTest = (testName: string, value: any) => {
    const updated = { ...patient, [testName]: value };
    setPatient(updated);
    runAnalysis(updated, mode, currentCompareWith);
  };

  // Copy JSON
  const handleCopyJson = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if value is out of training range
  const getRangeWarning = (field: string, val: any): string | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return null;
    const range = TRAINING_RANGES[field];
    if (range && (num < range[0] || num > range[1])) {
      return `Outside training range (${range[0]}–${range[1]}); result less reliable`;
    }
    return null;
  };

  const trueDiagnosis =
    selectedSampleIndex !== null && samples[selectedSampleIndex]
      ? samples[selectedSampleIndex].true_disease
      : null;

  const isPredictionMatch =
    trueDiagnosis && analysis?.prediction?.predicted_disease
      ? analysis.prediction.predicted_disease === trueDiagnosis
      : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Stethoscope className="w-6 h-6 text-teal-700 dark:text-teal-400" />
            <span>Differential Diagnosis Decision Support</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Range-aware Bayes clinical decision support across 7 autoimmune and rheumatic diseases.
          </p>
        </div>

        {/* Demo Sample Loader & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sample Loader */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedSampleIndex !== null ? selectedSampleIndex : ''}
              onChange={(e) => handleSelectSample(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 pr-8 shadow-xs focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Load sample patient (14 demo cases)...</option>
              {samples.map((_, idx) => (
                <option key={idx} value={idx}>
                  {SAMPLE_DESCRIPTIONS[idx] || `Sample ${idx + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mode Switch: Default vs Sensitive */}
          <div className="flex items-center space-x-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => {
                setMode('default');
                if (analysis) runAnalysis(patient, 'default', currentCompareWith);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                mode === 'default'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => {
                setMode('sensitive');
                if (analysis) runAnalysis(patient, 'sensitive', currentCompareWith);
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 ${
                mode === 'sensitive'
                  ? 'bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Raises recall for reactive arthritis from 66% to 86% at the cost of about 1.2 points of overall accuracy."
            >
              <span>Rare-Disease Mode</span>
              <Info className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: PATIENT FORM ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Patient Data Entry
              </h2>
              {/* Live Test Counter */}
              <div
                className={`text-xs px-2.5 py-1 rounded-full font-medium font-mono ${
                  canAnalyze
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {measuredCount} of 12 tests entered
                <span className="ml-1 text-[11px] font-normal font-sans">
                  ({canAnalyze ? 'ready' : 'min 3 needed'})
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canAnalyze) runAnalysis();
              }}
              className="space-y-5"
            >
              {/* Group 1: Demographics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Patient Demographics
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    Recorded; does not change Bayes prediction
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Age */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient.Age !== null && patient.Age !== undefined ? patient.Age : ''}
                      onChange={(e) => handleNumberChange('Age', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('Age', patient.Age) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('Age', patient.Age)}
                      </span>
                    )}
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Sex
                    </label>
                    <select
                      value={patient.Gender !== null && patient.Gender !== undefined ? String(patient.Gender) : ''}
                      onChange={(e) => {
                        setSelectedSampleIndex(null);
                        setPatient((prev) => ({ ...prev, Gender: e.target.value === '' ? null : e.target.value }));
                      }}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">not tested</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Inflammation Labs */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Inflammatory Markers
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ESR (mm/h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient.ESR !== null && patient.ESR !== undefined ? patient.ESR : ''}
                      onChange={(e) => handleNumberChange('ESR', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('ESR', patient.ESR) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('ESR', patient.ESR)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      CRP (mg/L)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient.CRP !== null && patient.CRP !== undefined ? patient.CRP : ''}
                      onChange={(e) => handleNumberChange('CRP', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('CRP', patient.CRP) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('CRP', patient.CRP)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 3: Rheumatoid Arthritis Antibodies */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  RA Antibodies
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      RF (IU/mL)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient.RF !== null && patient.RF !== undefined ? patient.RF : ''}
                      onChange={(e) => handleNumberChange('RF', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('RF', patient.RF) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('RF', patient.RF)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Anti-CCP (U/mL)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient['Anti-CCP'] !== null && patient['Anti-CCP'] !== undefined ? patient['Anti-CCP'] : ''}
                      onChange={(e) => handleNumberChange('Anti-CCP', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('Anti-CCP', patient['Anti-CCP']) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('Anti-CCP', patient['Anti-CCP'])}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 4: Complement Levels */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Complement System
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      C3 (mg/dL)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient.C3 !== null && patient.C3 !== undefined ? patient.C3 : ''}
                      onChange={(e) => handleNumberChange('C3', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('C3', patient.C3) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('C3', patient.C3)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      C4 (mg/dL)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="not tested"
                      value={patient.C4 !== null && patient.C4 !== undefined ? patient.C4 : ''}
                      onChange={(e) => handleNumberChange('C4', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />
                    {getRangeWarning('C4', patient.C4) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {getRangeWarning('C4', patient.C4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 5: Antibody Tests (3-way Segmented Controls) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Serological Antibody Tests
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Default: Not tested
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'HLA-B27', label: 'HLA-B27', desc: 'SpA' },
                    { key: 'ANA', label: 'ANA', desc: 'Sjögren/SLE' },
                    { key: 'Anti-Ro', label: 'Anti-Ro (SSA)', desc: 'Sjögren' },
                    { key: 'Anti-La', label: 'Anti-La (SSB)', desc: 'Sjögren' },
                    { key: 'Anti-dsDNA', label: 'Anti-dsDNA', desc: 'SLE' },
                    { key: 'Anti-Sm', label: 'Anti-Sm', desc: 'SLE' },
                  ].map(({ key, label, desc }) => {
                    const currentVal = patient[key as keyof PatientInput];
                    const activeState =
                      currentVal === 'Positive' || currentVal === 1 || currentVal === '1'
                        ? 'Positive'
                        : currentVal === 'Negative' || currentVal === 0 || currentVal === '0'
                        ? 'Negative'
                        : 'Not tested';

                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5">
                            ({desc})
                          </span>
                        </div>

                        {/* 3-way Segmented Control */}
                        <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 rounded-lg p-0.5 self-end sm:self-auto text-[11px]">
                          {(['Positive', 'Negative', 'Not tested'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAntibodyChange(key as keyof PatientInput, opt)}
                              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                                activeState === opt
                                  ? opt === 'Positive'
                                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                                    : opt === 'Negative'
                                    ? 'bg-teal-700 text-white shadow-xs font-semibold'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                <div className="relative group">
                  <button
                    type="submit"
                    disabled={!canAnalyze || loading}
                    className={`px-6 py-2.5 rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition-all ${
                      canAnalyze && !loading
                        ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Bayes...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyse Patient</span>
                      </>
                    )}
                  </button>

                  {!canAnalyze && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg text-center z-20 pointer-events-none">
                      Enter at least 3 of 12 clinical tests to run differential diagnosis.
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Session History in Left Column */}
          <SessionHistory
            history={history}
            onSelectHistory={(item) => {
              setPatient({ ...item.patient });
              setAnalysis(item.response);
              setMode(item.mode as any);
              setCurrentCompareWith(item.response.prediction.runner_up);
            }}
            onClearHistory={() => setHistory([])}
          />
        </div>

        {/* ================= RIGHT COLUMN: RESULTS PANEL ================= */}
        <div className="lg:col-span-7 space-y-5 results-panel">
          {/* Backend Error Banner if any */}
          {backendError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-semibold block">Diagnosis Error</strong>
                <p>{backendError}</p>
                <button
                  onClick={() => runAnalysis()}
                  className="mt-2 px-3 py-1 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Initial State / Skeleton */}
          {!analysis && !loading && !backendError && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Ready for Patient Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter lab and antibody values on the left, or select one of the 14 verified demo patient cases from the dropdown above to observe model inference.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleSelectSample('2')}
                  className="text-xs text-teal-700 dark:text-teal-400 font-medium hover:underline inline-flex items-center space-x-1"
                >
                  <span>Load Sample 3 (Healthy Control reference case)</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          )}

          {/* Real Results */}
          {analysis && !loading && (
            <div className="space-y-5">
              {/* 1. Status Banner */}
              <StatusBanner prediction={analysis.prediction} />

              {/* 2. Top Diagnosis Headline Card */}
              {analysis.prediction.status !== 'insufficient_data' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Top Suggested Diagnosis
                      </span>
                      <div className="flex items-baseline space-x-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {analysis.prediction.predicted_disease}
                        </h2>
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          ({SHORT_NAMES[analysis.prediction.predicted_disease || ''] || ''})
                        </span>
                      </div>

                      {/* Runner-up Note */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                        Runner-up:{' '}
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">
                          {analysis.prediction.runner_up}
                        </strong>{' '}
                        (
                        {formatProbability(
                          analysis.prediction.probabilities?.[analysis.prediction.runner_up || '']
                        )}
                        )
                      </p>
                    </div>

                    {/* Calibrated Confidence Badge */}
                    <div className="sm:text-right shrink-0">
                      <div className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-700 dark:text-teal-400">
                        {formatProbability(analysis.prediction.confidence)}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Calibrated posterior probability
                      </span>
                    </div>
                  </div>

                  {/* Sensitive Mode Special Display if differing */}
                  {analysis.prediction.mode === 'sensitive' &&
                    analysis.prediction.most_probable_disease &&
                    analysis.prediction.most_probable_disease !== analysis.prediction.predicted_disease && (
                      <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                        <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                          <Info className="w-4 h-4 text-amber-600" />
                          <span>Rare-Disease Sensitivity Mode Active</span>
                        </div>
                        <p className="text-amber-800 dark:text-amber-300">
                          <strong>Sensitive-mode suggestion:</strong> {analysis.prediction.predicted_disease} (re-weighted to prioritize rare presentation detection).
                        </p>
                        <p className="text-amber-700 dark:text-amber-300/80">
                          <strong>Most probable calibrated disease:</strong> {analysis.prediction.most_probable_disease} (
                          {formatProbability(analysis.prediction.probabilities?.[analysis.prediction.most_probable_disease])}
                          ).
                        </p>
                      </div>
                    )}

                  {/* Demo True Diagnosis Indicator */}
                  {trueDiagnosis && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        True diagnosis in benchmark dataset:
                      </span>
                      <span
                        className={`font-semibold flex items-center space-x-1.5 ${
                          isPredictionMatch
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isPredictionMatch ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span>{trueDiagnosis}</span>
                        <span className="font-normal text-slate-400 text-[11px]">
                          ({isPredictionMatch ? 'Matched' : 'Known benchmark miss'})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Calibrated Probability Bars */}
              {analysis.prediction.probabilities && (
                <ProbabilityBars
                  probabilities={analysis.prediction.probabilities}
                  predictedDisease={analysis.prediction.predicted_disease}
                  threshold={modelInfo?.confidence_threshold || 0.6666}
                />
              )}

              {/* 4. Single-Disease Diagnostic Evidence (Why this disease was predicted) */}
              {analysis.explanation && analysis.prediction.predicted_disease && (
                <DiseaseEvidenceCard
                  explanation={analysis.explanation}
                  predictedDisease={analysis.prediction.predicted_disease}
                  runnerUp={analysis.prediction.runner_up}
                />
              )}

              {/* 5. Next Best Test Recommendation */}
              {analysis.prediction.status === 'needs_review' && (
                <NextBestTest
                  recommendations={analysis.prediction.recommended_tests || []}
                  onSimulateTest={handleSimulateTest}
                />
              )}

              {/* 6. Warnings list */}
              {analysis.prediction.warnings && analysis.prediction.warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Clinical Input Warnings ({analysis.prediction.warnings.length}):</span>
                  </div>
                  <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc pl-5">
                    {analysis.prediction.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 7. Action Bar: Print PDF & Copy JSON */}
              <div className="flex items-center justify-end space-x-3 pt-2 no-print">
                <button
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
