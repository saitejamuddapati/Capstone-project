export interface PatientInput {
  Age?: number | string | null;
  Gender?: string | null;
  ESR?: number | string | null;
  CRP?: number | string | null;
  RF?: number | string | null;
  'Anti-CCP'?: number | string | null;
  'HLA-B27'?: string | null;
  ANA?: string | null;
  'Anti-Ro'?: string | null;
  'Anti-La'?: string | null;
  'Anti-dsDNA'?: string | null;
  'Anti-Sm'?: string | null;
  C3?: number | string | null;
  C4?: number | string | null;
}

export interface RecommendationItem {
  test: string;
  current_confidence: number;
  expected_confidence_after: number;
  chance_of_confident_answer: number;
}

export interface EvidenceItem {
  feature: string;
  value: any;
  impact: number;
  likelihood_ratio?: number;
  clinical_insight?: string;
  plain_language?: string;
  favors_target?: boolean;
  evidence_level?: string;
}

export interface PredictionResult {
  predicted_disease: string | null;
  confidence: number | null;
  runner_up: string | null;
  probabilities: Record<string, number> | null;
  status: 'confident' | 'needs_review' | 'insufficient_data';
  mode: string;
  missing_tests: string[];
  n_missing_tests: number;
  warnings: string[];
  recommended_tests: RecommendationItem[];
  message?: string | null;
  most_probable_disease?: string | null;
}

export interface ExplanationResult {
  method: string;
  explained_class: string;
  compared_with: string;
  probability: number;
  probability_compared: number;
  not_tested: string[];
  pushes_toward: EvidenceItem[];
  pushes_against: EvidenceItem[];
  scientific_summary?: string;
  general_summary?: string;
  single_disease_scientific_summary?: string;
  single_disease_general_summary?: string;
  disease_evidence?: EvidenceItem[];
  key_findings?: string[];
  questions_for_doctor?: string[];
}

export interface AnalysisResponse {
  prediction: PredictionResult;
  explanation: ExplanationResult | null;
  recommendations: RecommendationItem[];
}

export interface FeatureMeta {
  name: string;
  label: string;
  group: string;
  type: 'demographic' | 'lab' | 'antibody';
  unit?: string | null;
  training_range?: [number, number] | null;
  description: string;
}

export interface ModelInfo {
  model_name: string;
  classes: string[];
  short_names: string[];
  confidence_threshold: number;
  min_measured_tests: number;
  sensitivity_lambda: number;
  inputs: FeatureMeta[];
  mode_descriptions: {
    default: string;
    sensitive: string;
  };
}

export interface SamplePatient {
  true_disease: string;
  patient: PatientInput;
}

export interface BatchRowResult {
  row_index: number;
  predicted_disease: string | null;
  confidence: number | null;
  runner_up: string | null;
  status: string;
  n_missing_tests: number;
  warnings: string[];
  error?: string | null;
}

export interface BatchSummary {
  total_rows: number;
  successful_rows: number;
  status_counts: Record<string, number>;
  disease_counts: Record<string, number>;
}

export interface BatchResponse {
  summary: BatchSummary;
  results: BatchRowResult[];
}
