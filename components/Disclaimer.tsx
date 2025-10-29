
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const Disclaimer: React.FC = () => {
  return (
    <footer className="bg-amber-100 border-t-2 border-amber-300 text-amber-900 text-xs">
      <div className="container mx-auto p-3 flex items-start sm:items-center gap-3">
        <AlertTriangle className="w-8 h-8 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-bold">IMPORTANT: </span>
          Cura AI is an informational tool and not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </div>
      </div>
    </footer>
  );
};

export default Disclaimer;
