import React from 'react';
import { User, Bot, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, ChatRole } from '../types';

interface ChatMessageProps {
  message: Message;
  index: number;
  onPlayAudio: (text: string, index: number) => void;
  isPlaying: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, onPlayAudio, isPlaying }) => {
  const isUser = message.role === ChatRole.USER;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white flex-shrink-0">
          <Bot className="w-5 h-5" />
        </div>
      )}
      <div className="flex flex-col items-start max-w-[85%] md:max-w-xl">
         <div
            className={`p-3 rounded-lg w-full ${
            isUser
                ? 'bg-cyan-500 text-white rounded-br-none'
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}
        >
            {message.image && (
            <img
                src={message.image}
                alt="User upload"
                className="rounded-md mb-2 max-w-xs object-contain bg-black/5"
            />
            )}
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
        </div>
        {!isUser && message.text && (
            <button 
                onClick={() => onPlayAudio(message.text, index)}
                className="mt-2 p-1.5 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
                aria-label={isPlaying ? "Stop audio" : "Play audio"}
            >
                {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
          <User className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;