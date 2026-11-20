import React from 'react';
import { History, Trash2, ChevronRight } from 'lucide-react';
import { PatientInput, AnalysisResponse } from '../types';

export interface HistoryItem {
  id: string;
  timestamp: string;
  disease: string;
  status: string;
  confidence: number;
  mode: string;
  patient: PatientInput;
  response: AnalysisResponse;
}

interface SessionHistoryProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 session-history-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Session History (Last {history.length})
          </h3>
        </div>
        <button
          onClick={onClearHistory}
          className="flex items-center space-x-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear history</span>
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Clinical privacy: data lives strictly in your browser session and is never persisted on the server.
      </p>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="w-full text-left p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 hover:border-teal-200 dark:hover:border-teal-800 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  item.status === 'confident'
                    ? 'bg-emerald-500'
                    : item.status === 'needs_review'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <div className="truncate">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                  {item.disease || 'Insufficient data'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {item.timestamp} · {item.mode === 'sensitive' ? 'Sensitive mode' : 'Default mode'}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
};
