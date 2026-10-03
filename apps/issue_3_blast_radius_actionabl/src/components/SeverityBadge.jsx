import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const SeverityBadge = ({ severity }) => {
  switch (severity) {
    case 'Breaking Change Risk':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          Breaking Change Risk
        </span>
      );
    case 'Type Only':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          Type Only
        </span>
      );
    case 'Untouched Consumer':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Untouched Consumer
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {severity}
        </span>
      );
  }
};
