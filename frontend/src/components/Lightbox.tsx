import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  src,
  alt,
  caption,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 text-sm font-semibold truncate pr-4">
            <ZoomIn className="w-4 h-4 text-teal-600" />
            <span className="truncate">{alt}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Content */}
        <div className="overflow-auto p-4 flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <img
            src={src}
            alt={alt}
            className="max-h-[72vh] max-w-full object-contain rounded-lg"
          />
        </div>

        {/* Footer Caption */}
        {caption && (
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};
