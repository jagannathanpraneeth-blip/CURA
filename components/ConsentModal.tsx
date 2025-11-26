
import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ConsentModalProps {
  onAccept: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-cyan-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Cura AI</h2>
          <p className="text-slate-600 mb-6">
            Your intelligent medical & wellness assistant.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left w-full">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Medical Disclaimer</p>
                <p className="mb-2">
                  Cura AI is an AI-powered informational tool. It is <strong>not a doctor</strong> and cannot provide medical diagnoses, treatment, or prescriptions. 
                </p>
                <p>
                  Always consult a qualified healthcare professional for medical advice. In emergencies, contact your local emergency services immediately.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6 px-4">
            By continuing, you acknowledge that you understand these limitations and agree that this tool is for informational purposes only.
          </p>

          <button
            onClick={onAccept}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-cyan-600/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
