import {
  PatientInput,
  AnalysisResponse,
  ModelInfo,
  SamplePatient,
  BatchResponse,
  ExplanationResult,
} from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || '/api';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error (${status}): ${detail}`);
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errorJson = await res.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((d: any) => `${d.loc?.join('.') || ''}: ${d.msg}`).join(', ');
      }
    } catch {
      errorDetail = res.statusText || `HTTP ${res.status}`;
    }
    throw new ApiError(res.status, errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<any>(res);
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/model-info`);
    return handleResponse<ModelInfo>(res);
  },

  async getSamplePatients(): Promise<SamplePatient[]> {
    const res = await fetch(`${API_BASE}/samples`);
    return handleResponse<SamplePatient[]>(res);
  },

  async getClassProfiles(): Promise<any> {
    const res = await fetch(`${API_BASE}/profiles`);
    return handleResponse<any>(res);
  },

  async analyze(
    patient: PatientInput,
    mode: string = 'default',
    compareWith?: string | null,
    targetClass?: string | null
  ): Promise<AnalysisResponse> {
    const body: Record<string, any> = {
      patient,
      mode,
    };
    if (compareWith) {
      body.compare_with = compareWith;
    }
    if (targetClass) {
      body.target_class = targetClass;
    }
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<AnalysisResponse>(res);
  },

  async explain(
    patient: PatientInput,
    compareWith?: string | null,
    topK: number = 12,
    targetClass?: string | null
  ): Promise<ExplanationResult | { status: string; message: string }> {
    let url = `${API_BASE}/explain?top_k=${topK}`;
    if (compareWith) url += `&compare_with=${encodeURIComponent(compareWith)}`;
    if (targetClass) url += `&target_class=${encodeURIComponent(targetClass)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    return handleResponse<ExplanationResult>(res);
  },

  async getMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/metrics`);
    return handleResponse<any>(res);
  },

  async uploadBatch(
    file: File,
    mode: string = 'default',
    format: 'json' | 'csv' = 'json'
  ): Promise<BatchResponse | Blob> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/batch?mode=${mode}&format=${format}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      return handleResponse<BatchResponse>(res);
    }

    if (format === 'csv') {
      return res.blob();
    }
    return res.json() as Promise<BatchResponse>;
  },
};
