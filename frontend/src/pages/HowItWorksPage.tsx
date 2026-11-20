import React from 'react';
import {
  Database,
  Split,
  FileSearch,
  Cpu,
  CheckCircle,
  FileCheck,
  Rocket,
  ShieldAlert,
  TrendingDown,
  Scale
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How It Works: Methodological Framework & Clinical Logic
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          From multi-center cohort data to calibrated Bayesian inference: an explainable clinical decision-support architecture built without data imputation.
        </p>
      </div>

      {/* 1. Methodology Narrative (7 Steps) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center">
            7
          </span>
          <span>End-to-End Scientific Pipeline</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              step: '1',
              title: 'Clinical Data Curation',
              desc: '12,085 patient records from Harvard Dataverse spanning 7 autoimmune and rheumatic diagnoses with 14 routine laboratory and antibody features.',
              icon: Database,
            },
            {
              step: '2',
              title: 'Stratified Split & Locked Test Set',
              desc: 'Rigorous 85/15 stratified train/test split. Exactly 1,813 test patients were sealed and locked until final model validation.',
              icon: Split,
            },
            {
              step: '3',
              title: 'Comprehensive Data Audit',
              desc: 'Verified conditional independence among clinical markers and discovered disease-specific reference ranges and natural boundaries in lab titers.',
              icon: FileSearch,
            },
            {
              step: '4',
              title: 'Candidate Model Exploration',
              desc: 'Benchmarked Logistic Regression, Random Forest, LightGBM, CatBoost, XGBoost, Soft-Voting Ensembles, and Multi-Level Stacking.',
              icon: Cpu,
            },
            {
              step: '5',
              title: 'Pre-Registered Model Selection',
              desc: 'Range-aware Bayes selected on training CV by lowest calibration log-loss (0.2517) and superior resistance to missing tests.',
              icon: CheckCircle,
            },
            {
              step: '6',
              title: 'Frozen Test Set Evaluation',
              desc: 'Evaluated on the 1,813 locked patients: 86.10% accuracy (95% CI 84.4–87.6%), ROC-AUC 0.989, and calibration error ECE = 0.015.',
              icon: FileCheck,
            },
            {
              step: '7',
              title: 'Lightweight Clinical Deployment',
              desc: 'Packaged into a compact 7.5 KB model bundle executing in ~30 ms on CPU with zero GPU dependencies and exact likelihood ratio explanations.',
              icon: Rocket,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start space-x-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Step {item.step}: {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Why the Range-Aware Bayes Model? (5 Cards + Honest Trade-off) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Why the Range-Aware Bayes Model?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Fits the Clinical Data',
              desc: 'Unlike standard Gaussian Bayes, bin edges sit exactly on each disease’s minimum and maximum observed values, naturally capturing diagnostic thresholds.',
            },
            {
              title: 'Most Accurate on Frozen Test Set',
              desc: 'Achieved 86.10% test accuracy and 85.76% ± 0.66% across repeated splits, reaching 99.5% of the theoretical dataset ceiling (86.18%).',
            },
            {
              title: 'Honest & Well-Calibrated Confidence',
              desc: 'Temperature calibration (T = 1.069) achieved an Expected Calibration Error of 0.015. Probabilities represent realistic diagnostic likelihoods.',
            },
            {
              title: 'Never Invents Missing Values',
              desc: 'Unmeasured tests are omitted from the likelihood product. Zero median imputation, mean imputation, or synthetic value fabrication is performed.',
            },
            {
              title: 'Exact Explanations & 7.5 KB Bundle',
              desc: 'Bayes odds decompose additively into exact likelihood ratios for every test. The entire model bundle is just 7.5 KB and executes in 30 ms.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
            >
              <span className="text-teal-700 dark:text-teal-400 font-mono text-xs font-bold">
                0{i + 1}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {card.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}

          {/* Honest Trade-off Card */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />
              <span>The Honest Clinical Trade-off</span>
            </div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
              Sensitivity to Lab Measurement Noise
            </h3>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              Because bin edges are sharp at diagnostic cutoffs, when 5% measurement noise is injected into lab values, the model’s accuracy lead disappears (all models converge to ~81%).
            </p>
          </div>
        </div>
      </div>

      {/* 3. How to Read an Explanation (Sample 3 Walkthrough) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Scale className="w-5 h-5 text-teal-600" />
          <span>How to Read an Explanation: The Sample 3 Case Study</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          In this decision support tool, explanations are not black-box approximations (such as kernel SHAP). They are <strong>exact likelihood ratios</strong> derived directly from Bayes’ Theorem:
        </p>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center text-slate-700 dark:text-slate-300">
          log [ P(Disease A | Tests) / P(Disease B | Tests) ] = log [ Prior Odds ] + Σ log [ P(Test_i | Disease A) / P(Test_i | Disease B) ]
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 space-y-2">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
              Tests Pushing Toward "Normal"
            </span>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4">
              <li>
                <strong>Anti-CCP = 14.5 U/mL</strong> → Likelihood ratio <strong>2.063×</strong> (twice as likely under Normal than Sjögren’s).
              </li>
              <li>
                <strong>RF = 10.4 IU/mL</strong> → Likelihood ratio <strong>1.989×</strong> (normal rheumatoid factor levels support healthy control).
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Tests Pushing Toward "Sjögren's Syndrome"
            </span>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4">
              <li>
                <strong>ANA = Positive</strong> → Likelihood ratio <strong>0.504×</strong> (~2× more likely under Sjögren’s).
              </li>
              <li>
                <strong>Anti-Ro = Positive</strong> → Likelihood ratio <strong>0.510×</strong> (~2× more likely under Sjögren’s).
              </li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
          Result: The two opposing forces balance out, producing confidence of 50.99% for Normal and 49.00% for Sjögren’s. Because confidence is below 66.7%, the CDSS flags the case for <strong>Clinical Review</strong> and recommends ordering <strong>Anti-La (SSB)</strong>.
        </p>
      </div>

      {/* 4. Limitations & Safe Usage */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <span>Known Limitations & Honest Constraints</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
            <strong className="font-semibold text-slate-900 dark:text-white block">
              1. Single-Source Dataset
            </strong>
            <p>
              Trained exclusively on 12,085 patients from Harvard Dataverse. Prospective external hospital validation across diverse clinical centers has not yet been performed.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
            <strong className="font-semibold text-slate-900 dark:text-white block">
              2. Incorporation Bias
            </strong>
            <p>
              In clinical medicine, laboratory markers like RF and HLA-B27 are themselves components of classification criteria, creating circular incorporation bias in cohort labeling.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
            <strong className="font-semibold text-slate-900 dark:text-white block">
              3. Atypical Antibody Patterns
            </strong>
            <p>
              Real-world autoimmune presentations occasionally exhibit overlapping antibody serology not fully represented in public benchmark cohorts.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
            <strong className="font-semibold text-slate-900 dark:text-white block">
              4. Absence of Symptoms & Imaging
            </strong>
            <p>
              The model evaluates only 14 laboratory and antibody markers. It does not ingest joint pain distributions, morning stiffness duration, X-ray, or MRI imaging findings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
