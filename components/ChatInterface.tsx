import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Mic, Volume2, VolumeX } from 'lucide-react';
import { Message, ChatRole, ChatMode } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { generateResponse } from '../services/geminiService';
import { FEATURES } from '../constants';

// For browsers that don't support SpeechRecognition
// Fix: Cast window to `any` to access non-standard SpeechRecognition APIs and avoid TypeScript errors.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface ChatInterfaceProps {
  mode: ChatMode;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode }) => {
  const feature = FEATURES.find(f => f.mode === mode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (feature) {
      setMessages([{ role: ChatRole.AI, text: feature.initialMessage }]);
    }
  }, [feature]);
  
  // Speech Recognition Effect
  useEffect(() => {
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);
  
  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!input.trim() && !file)) return;

    const userMessage: Message = {
      role: ChatRole.USER,
      text: input,
      image: file ? URL.createObjectURL(file) : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setFile(null);
    setIsLoading(true);

    try {
      let prompt = input;
      if (mode === 'lab') {
        prompt = `Please interpret this lab report. ${input}`;
      } else if (mode === 'prescription') {
        prompt = `Please explain this prescription. ${input}`;
      } else if (mode === 'medication') {
        prompt = `Please provide educational information about the following, without giving a prescription or medical advice: ${input}`;
      }
      
      const responseText = await generateResponse(prompt, file || undefined);
      
      setMessages(prev => [...prev, { role: ChatRole.AI, text: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: ChatRole.AI, text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };
  
  const handlePlayAudio = (text: string, index: number) => {
    if (currentlyPlaying === index) {
        window.speechSynthesis.cancel();
        setCurrentlyPlaying(null);
        return;
    }
    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setCurrentlyPlaying(index);
    utterance.onend = () => setCurrentlyPlaying(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col flex-grow bg-white rounded-lg shadow-inner overflow-hidden border border-slate-200">
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            index={index}
            onPlayAudio={handlePlayAudio}
            isPlaying={currentlyPlaying === index}
           />
        ))}
        {isLoading && <LoadingSpinner />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-100 border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="relative">
          {file && (
            <div className="absolute bottom-full left-0 mb-2 w-auto bg-slate-200 text-slate-700 text-sm py-1 px-3 rounded-full flex items-center gap-2">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-0.5 rounded-full hover:bg-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={isRecording ? "Listening..." : "Type your message or upload a document..."}
              className="flex-grow w-full px-4 py-2 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={1}
              disabled={isLoading}
            />
             {(mode === 'lab' || mode === 'prescription') && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
                  disabled={isLoading}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </>
            )}
             {SpeechRecognition && (
                <button
                    type="button"
                    onClick={handleToggleRecording}
                    className={`p-3 rounded-full transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                    disabled={isLoading}
                >
                    <Mic className="w-5 h-5" />
                </button>
            )}
            <button
              type="submit"
              className="p-3 rounded-full bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:bg-slate-400 flex-shrink-0"
              disabled={isLoading || (!input.trim() && !file)}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;