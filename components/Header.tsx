
import React from 'react';
import { ArrowLeft, HeartPulse } from 'lucide-react';

interface HeaderProps {
    onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-cyan-600" />
            <span className="text-2xl font-bold text-slate-800">Cura AI</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
