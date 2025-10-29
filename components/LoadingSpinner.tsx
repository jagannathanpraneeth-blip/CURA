
import React from 'react';
import { Bot } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white flex-shrink-0">
            <Bot className="w-5 h-5" />
        </div>
        <div className="max-w-xl p-3 rounded-lg bg-slate-100 text-slate-800 rounded-bl-none flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
        </div>
    </div>
  );
};

export default LoadingSpinner;
