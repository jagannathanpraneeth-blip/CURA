
import React, { useState } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Disclaimer from './components/Disclaimer';
import FeatureCard from './components/FeatureCard';
import { ChatMode } from './types';
import { FEATURES } from './constants';

const App: React.FC = () => {
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);

  const handleSelectMode = (mode: ChatMode) => {
    setChatMode(mode);
  };

  const handleBack = () => {
    setChatMode(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
      <Header onBack={chatMode ? handleBack : undefined} />
      <main className="flex-grow container mx-auto p-4 flex flex-col">
        {chatMode === null ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
             <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
                Welcome to <span className="text-cyan-600">Cura AI</span>
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Your 24/7 intelligent medical companion. How can I help you today?
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 w-full max-w-7xl">
              {FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.mode}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  onClick={() => handleSelectMode(feature.mode)}
                />
              ))}
            </div>
          </div>
        ) : (
          <ChatInterface mode={chatMode} />
        )}
      </main>
      <Disclaimer />
    </div>
  );
};

export default App;