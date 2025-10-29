
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-left flex flex-col items-start h-full transform hover:-translate-y-1"
    >
      <div className="bg-cyan-50 p-3 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 flex-grow">{description}</p>
    </button>
  );
};

export default FeatureCard;
