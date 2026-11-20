import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RefreshCw,
  FileDown,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api, ApiError } from '../api/client';
import { BatchResponse } from '../types';
import { generateCSVTemplate, formatProbability } from '../utils/formatters';

export const BatchPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'default' | 'sensitive'>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<BatchResponse | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const pageSize = 15;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a valid .csv file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'patient_batch_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessBatch = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await api.uploadBatch(file, mode, 'json')) as BatchResponse;
      setBatchData(res);
      setPage(1);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('Failed to process batch CSV. Ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResultsCSV = async () => {
    if (!file) return;
    try {
      const blob = (await api.uploadBatch(file, mode, 'csv')) as Blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'batch_predictions_results.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download results CSV:', err);
    }
  };

  // Filtered rows
  const filteredResults = batchData
    ? batchData.results.filter((r) => {
        if (statusFilter === 'all') return true;
        return r.status === statusFilter;
      })
    : [];

  const totalPages = Math.ceil(filteredResults.length / pageSize);
  const paginatedRows = filteredResults.slice((page - 1) * pageSize, page * pageSize);

  // Disease chart data
  const diseaseChartData = batchData
    ? Object.entries(batchData.summary.disease_counts).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <FileSpreadsheet className="w-7 h-7 text-teal-700 dark:text-teal-400" />
            <span>Batch Patient Evaluation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload CSV cohort data for in-memory batch predictions. Process up to 2,000 patients with per-row error handling.
          </p>
        </div>

        {/* Template Download Button */}
        <button
          onClick={handleDownloadTemplate}
          className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2 shadow-xs shrink-0"
        >
          <FileDown className="w-4 h-4 text-teal-600" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Upload Zone & Mode Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-950/40"
          onClick={() => document.getElementById('csv-file-input')?.click()}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {file ? file.name : 'Drag and drop your patient cohort CSV here, or click to browse'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supported format: UTF-8 encoded .csv with 14 column headers (Max 2,000 rows, 2 MB)
          </p>
        </div>

        {/* Settings and Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Mode Switch */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Model Mode:</span>
            <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setMode('default')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  mode === 'default'
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Default Calibrated
              </button>
              <button
                onClick={() => setMode('sensitive')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  mode === 'sensitive'
                    ? 'bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Rare-Disease Sensitivity
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center space-x-3">
            {file && (
              <span className="text-xs text-slate-500 font-mono">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
            <button
              onClick={handleProcessBatch}
              disabled={!file || loading}
              className={`px-6 py-2.5 rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition-all ${
                file && !loading
                  ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Cohort...</span>
                </>
              ) : (
                <>
                  <BarChart2 className="w-4 h-4" />
                  <span>Run Batch Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error alert if any */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-[11px] text-slate-400 italic">
          Privacy guarantee: CSV files are processed in-memory and never saved to the server or database.
        </div>
      </div>

      {/* Results Section */}
      {batchData && (
        <div className="space-y-6">
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Total Patients</span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                {batchData.summary.total_rows}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Confident Answers</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                {batchData.summary.status_counts.confident || 0}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Needs Review</span>
              <div className="text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-300 mt-1">
                {batchData.summary.status_counts.needs_review || 0}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500">Insufficient Data</span>
              <div className="text-2xl font-extrabold font-mono text-slate-700 dark:text-slate-300 mt-1">
                {batchData.summary.status_counts.insufficient_data || 0}
              </div>
            </div>
          </div>

          {/* Disease Distribution Bar Chart */}
          {diseaseChartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Disease Classification Breakdown
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: any) => [val, 'Patients']} />
                    <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Patient Cohort Results ({filteredResults.length})
                </h3>

                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All statuses</option>
                  <option value="confident">Confident only</option>
                  <option value="needs_review">Needs review only</option>
                  <option value="insufficient_data">Insufficient data only</option>
                </select>
              </div>

              {/* Download Results CSV */}
              <button
                onClick={handleDownloadResultsCSV}
                className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-end sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Results CSV</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 pr-2">Row #</th>
                    <th className="py-2.5 px-3">Predicted Disease</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Runner-Up</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Missing Tests</th>
                    <th className="py-2.5 pl-3">Warnings / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {paginatedRows.map((row) => (
                    <tr key={row.row_index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pr-2 text-slate-400">
                        #{row.row_index}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {row.predicted_disease || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-teal-800 dark:text-teal-300 font-semibold">
                        {formatProbability(row.confidence)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {row.runner_up || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.status === 'confident'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              : row.status === 'needs_review'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                              : row.status === 'insufficient_data'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {row.n_missing_tests}
                      </td>
                      <td className="py-2.5 pl-3 font-sans text-[11px] text-slate-500 max-w-xs truncate">
                        {row.error ? (
                          <span className="text-rose-600 font-medium">{row.error}</span>
                        ) : row.warnings.length > 0 ? (
                          <span className="text-amber-600">{row.warnings.join('; ')}</span>
                        ) : (
                          'None'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredResults.length)} of {filteredResults.length} rows
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                  >
                    Previous
                  </button>
                  <span className="font-mono">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
