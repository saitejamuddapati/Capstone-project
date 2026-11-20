import React from 'react';
import { Users, GraduationCap, BookOpen, ShieldAlert } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'M. Sai Teja',
      role: 'Machine Learning Engineer',
      focus: 'Range-aware Bayes design, temperature calibration, sensitivity weighting, and information-gain recommendations.',
    },
    {
      name: 'V. Jahnavi Sai',
      role: 'Data Engineer',
      focus: 'Multi-center cohort extraction, data audit, conditional independence verification, and reproducible train/test splits.',
    },
    {
      name: 'B. Varsha Sree',
      role: 'XAI & Evaluation Lead',
      focus: 'Exact likelihood ratio explanations, SHAP interpretability audits, repeated split benchmarking, and statistical testing.',
    },
    {
      name: 'G. Jaswa Preethi',
      role: 'Backend & Dashboard Developer',
      focus: 'FastAPI microservice architecture, Pydantic data validation, interactive clinical visualization, and batch cohort processing.',
    },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          About the Project & Research Team
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Final Year Capstone Project developed at the Department of Computer Science and Engineering, VIT-AP University (Academic Year 2026–27).
        </p>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Explainable AI for Early Differential Diagnosis of Rheumatic and Autoimmune Diseases
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Rheumatic and autoimmune diseases share overlapping clinical phenotypes and non-specific inflammatory presentations, leading to significant diagnostic delays in primary care. This project introduces a decision-support system built upon a novel Range-aware Bayes model calibrated with temperature scaling (T = 1.069). Without relying on synthetic data imputation, the model delivers calibrated differential probabilities, exact test-level likelihood ratios, and information-gain test recommendations to support rheumatologists and faculty evaluators.
        </p>
      </div>

      {/* Team Members Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Users className="w-5 h-5 text-teal-600" />
          <span>Project Team</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1.5"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {member.name}
              </h3>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 block font-mono">
                {member.role}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                {member.focus}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Guide & Department */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-teal-600" />
          <span>Faculty Supervision & Institution</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <strong className="text-sm font-semibold text-slate-900 dark:text-white block">
              Dr. Sandipan Maiti
            </strong>
            <span className="text-xs text-teal-700 dark:text-teal-400 font-medium block">
              Project Guide
            </span>
            <p className="mt-1">
              Department of Computer Science and Engineering (SCOPE)
            </p>
            <p>VIT-AP University, Andhra Pradesh, India</p>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Academic Year
            </span>
            <span className="font-mono text-slate-500 block">2026–2027</span>
            <span className="text-[11px] text-slate-400 block">Bachelor of Technology (B.Tech) CSE</span>
          </div>
        </div>
      </div>

      {/* Dataset Citation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-teal-600" />
          <span>Dataset Citation & Acknowledgements</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          The models in this work were trained and validated on the open-access public autoimmune disease benchmark cohort published on Harvard Dataverse:
        </p>
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 select-all">
          Harvard Dataverse Benchmark: Autoimmune and Rheumatic Disease Cohort (N = 12,085 patients). DOI: 10.7910/DVN/VM4OR3
        </div>
      </div>

      {/* Full Clinical Disclaimer Card */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-6 border border-amber-300 dark:border-amber-800 space-y-2.5">
        <h2 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Comprehensive Clinical & Legal Disclaimer</span>
        </h2>
        <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
          This web application and the underlying machine learning models are developed strictly as a decision-support research and educational prototype. A model prediction, confidence probability, or test recommendation is not a clinical diagnosis or medical prescription. Diagnostic conclusions and treatment pathways must be determined solely by licensed healthcare professionals and qualified rheumatologists in consultation with individual patient clinical presentations. The development team and VIT-AP University assume no liability for medical decisions made using this application.
        </p>
      </div>
    </div>
  );
};
