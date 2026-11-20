import React, { useState } from 'react';
import {
  Stethoscope,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ExplanationResult, EvidenceItem } from '../types';

interface DiseaseEvidenceCardProps {
  explanation: ExplanationResult;
  predictedDisease: string;
  runnerUp?: string | null;
}

const FEATURE_META_MAP: Record<
  string,
  { label: string; unit: string; normal: string; category: string }
> = {
  ESR: {
    label: 'Erythrocyte Sedimentation Rate',
    unit: 'mm/h',
    normal: '< 20 mm/h',
    category: 'Inflammatory Marker',
  },
  CRP: {
    label: 'C-Reactive Protein',
    unit: 'mg/L',
    normal: '< 5.0 mg/L',
    category: 'Inflammatory Marker',
  },
  RF: {
    label: 'Rheumatoid Factor',
    unit: 'IU/mL',
    normal: '< 20 IU/mL',
    category: 'Autoantibody (RA)',
  },
  'Anti-CCP': {
    label: 'Anti-Cyclic Citrullinated Peptide',
    unit: 'U/mL',
    normal: '< 20 U/mL',
    category: 'Autoantibody (RA)',
  },
  'HLA-B27': {
    label: 'HLA-B27 Genetic Marker',
    unit: '',
    normal: 'Negative',
    category: 'Genetic Serology',
  },
  ANA: {
    label: 'Antinuclear Antibodies',
    unit: '',
    normal: 'Negative',
    category: 'Screening Autoantibody',
  },
  'Anti-Ro': {
    label: 'Anti-Ro (SSA) Antibodies',
    unit: '',
    normal: 'Negative',
    category: 'ENA Autoantibody',
  },
  'Anti-La': {
    label: 'Anti-La (SSB) Antibodies',
    unit: '',
    normal: 'Negative',
    category: 'ENA Autoantibody',
  },
  'Anti-dsDNA': {
    label: 'Anti-dsDNA Antibodies',
    unit: '',
    normal: 'Negative',
    category: 'Autoantibody (SLE)',
  },
  'Anti-Sm': {
    label: 'Anti-Smith Antibodies',
    unit: '',
    normal: 'Negative',
    category: 'Autoantibody (SLE)',
  },
  C3: {
    label: 'Complement Component 3',
    unit: 'mg/dL',
    normal: '90 - 180 mg/dL',
    category: 'Complement Cascade',
  },
  C4: {
    label: 'Complement Component 4',
    unit: 'mg/dL',
    normal: '10 - 40 mg/dL',
    category: 'Complement Cascade',
  },
};

export const DiseaseEvidenceCard: React.FC<DiseaseEvidenceCardProps> = ({
  explanation,
  predictedDisease,
  runnerUp,
}) => {
  const [viewMode, setViewMode] = useState<'scientific' | 'general'>('scientific');

  // Biomarkers favoring or measured for this disease
  const diseaseEvidence: EvidenceItem[] =
    explanation.disease_evidence && explanation.disease_evidence.length > 0
      ? explanation.disease_evidence
      : [
          ...explanation.pushes_toward.map((item) => ({
            ...item,
            favors_target: true,
            evidence_level:
              item.impact >= 2.3
                ? 'Strong Favor'
                : item.impact >= 0.7
                ? 'Moderate Favor'
                : 'Supportive',
          })),
          ...explanation.pushes_against.map((item) => ({
            ...item,
            favors_target: false,
            evidence_level: 'Neutral / Atypical',
          })),
        ];

  // Maximum positive impact for bar scaling
  const maxImpact = Math.max(
    ...diseaseEvidence.map((e) => Math.max(e.impact, 0)),
    1.0
  );

  const favoringItems = diseaseEvidence.filter((e) => e.favors_target !== false && e.impact >= 0);
  const neutralOrAtypical = diseaseEvidence.filter((e) => e.favors_target === false || e.impact < 0);

  const scientificSummary =
    explanation.single_disease_scientific_summary || explanation.scientific_summary;
  const generalSummary =
    explanation.single_disease_general_summary || explanation.general_summary;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs transition-colors">
      {/* 1. Header with clear full-width layout and spacious controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Diagnostic Evidence: Why was {predictedDisease} diagnosed?
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Range-Aware Bayes Attribution
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Biomarker evidence breakdown showing how this patient&apos;s laboratory and antibody tests substantiate{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{predictedDisease}</span>.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('scientific')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'general'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>General (Plain English)</span>
          </button>
        </div>
      </div>

      {/* 2. Structured Narrative Box */}
      <div
        className={`rounded-xl p-4 border transition-all ${
          viewMode === 'scientific'
            ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200/80 dark:border-teal-800/60'
            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60'
        }`}
      >
        <div className="flex items-center space-x-2 mb-2">
          {viewMode === 'scientific' ? (
            <Stethoscope className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
          ) : (
            <HeartHandshake className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {viewMode === 'scientific'
              ? `Scientific Diagnostic Rationale for ${predictedDisease}`
              : `Plain-Language Summary for Patient & Family`}
          </span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {viewMode === 'scientific' ? scientificSummary : generalSummary}
        </p>
      </div>

      {/* 3. Biomarker Favor Graph for this particular disease */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Evidence Favoring {predictedDisease}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Ordered by diagnostic support weight
          </span>
        </div>

        {/* Biomarkers favoring this disease */}
        {favoringItems.length > 0 ? (
          <div className="space-y-3">
            {favoringItems.map((item) => {
              const meta = FEATURE_META_MAP[item.feature];
              const pctWidth = Math.min(
                100,
                Math.max(12, Math.round((Math.max(item.impact, 0.2) / maxImpact) * 100))
              );
              const isStrong = item.impact >= 2.3;
              const isModerate = item.impact >= 0.7 && item.impact < 2.3;

              return (
                <div
                  key={item.feature}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-teal-200 dark:hover:border-teal-800 transition-colors space-y-2.5"
                >
                  {/* Top line: Feature name, measured value, reference, level badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.feature}
                      </span>
                      {meta && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          ({meta.label})
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        Value: {String(item.value)} {meta?.unit || ''}
                      </span>
                      {meta?.normal && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                          Ref: {meta.normal}
                        </span>
                      )}
                    </div>

                    {/* Evidence Level Badge */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          isStrong
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : isModerate
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {item.evidence_level || (isStrong ? 'Strong Favor' : isModerate ? 'Moderate Favor' : 'Supportive')}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Favor Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isStrong
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600'
                          : isModerate
                          ? 'bg-gradient-to-r from-teal-500 to-teal-600'
                          : 'bg-gradient-to-r from-sky-400 to-teal-500'
                      }`}
                      style={{ width: `${pctWidth}%` }}
                    />
                  </div>

                  {/* Specific narrative insight */}
                  <div className="pt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    {viewMode === 'scientific'
                      ? item.clinical_insight || `Positive Bayes evidence factor favoring ${predictedDisease}.`
                      : item.plain_language || `This test result points toward ${predictedDisease}.`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 text-center">
            No strong individual favoring features identified among measured tests.
          </div>
        )}

        {/* Neutral or Atypical Findings (if any) */}
        {neutralOrAtypical.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Neutral or Atypical Findings for {predictedDisease}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {neutralOrAtypical.map((item) => (
                <div
                  key={item.feature}
                  className="p-2.5 rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-slate-700 dark:text-slate-300 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.feature}: {String(item.value)}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                      {item.evidence_level || 'Atypical / Neutral'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {viewMode === 'scientific' ? item.clinical_insight : item.plain_language}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Unmeasured Tests Badge List */}
      {explanation.not_tested && explanation.not_tested.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Unmeasured Tests ({explanation.not_tested.length} tests not ordered):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {explanation.not_tested.map((testName) => (
              <span
                key={testName}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                {testName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Clean CTA linking to Comparison Centre */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-violet-200 dark:border-violet-800/80 bg-violet-50/60 dark:bg-violet-950/20 gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-violet-950 dark:text-violet-200 font-semibold text-xs">
              <FlaskConical className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span>Looking for Differential Contrast?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Compare <span className="font-semibold text-violet-900 dark:text-violet-300">{predictedDisease}</span> side-by-side with{' '}
              {runnerUp ? (
                <>
                  differential runner-up <span className="font-semibold text-violet-900 dark:text-violet-300">{runnerUp}</span>
                </>
              ) : (
                'any alternative autoimmune condition'
              )}{' '}
              in the dedicated Comparison Centre.
            </p>
          </div>
          <NavLink
            to="/explanation"
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
          >
            <span>Open Comparison Centre</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>
    </div>
  );
};
