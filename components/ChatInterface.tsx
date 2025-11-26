
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Mic, Trash2, Info, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { Message, ChatRole, ChatMode } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { generateResponse } from '../services/geminiService';
import { FEATURES } from '../constants';
import { storageService } from '../services/storageService';

// For browsers that don't support SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface ChatInterfaceProps {
  mode: ChatMode;
}

interface LastSubmission {
  text: string;
  file: File | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode }) => {
  const feature = FEATURES.find(f => f.mode === mode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<LastSubmission | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load messages from backend API
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      setIsHistoryLoading(true);
      const savedMessages = await storageService.getMessages(mode);
      if (isMounted) {
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
        } else if (feature) {
          setMessages([{ role: ChatRole.AI, text: feature.initialMessage }]);
        }
        setIsHistoryLoading(false);
      }
    };
    loadHistory();
    return () => { isMounted = false; };
  }, [mode, feature]);

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
  }, [messages, isLoading, error, isHistoryLoading]);

  const processMessage = async (text: string, attachment: File | null) => {
    setIsLoading(true);
    setError(null);
    setLastSubmission({ text, file: attachment });

    try {
      let prompt = text;
      // Note: System instructions are now handled on the backend, 
      // but specific task framing can still be helpful here.
      if (mode === 'lab') {
        prompt = `Please interpret this lab report. ${text}`;
      } else if (mode === 'prescription') {
        prompt = `Please explain this prescription. ${text}`;
      } else if (mode === 'medication') {
        prompt = `Please provide educational information about the following, without giving a prescription or medical advice: ${text}`;
      }
      
      // Pass 'mode' to the service so the backend knows where to save it
      const responseText = await generateResponse(mode, prompt, attachment || undefined);
      
      setMessages(prev => [...prev, { role: ChatRole.AI, text: responseText }]);
      setLastSubmission(null); 
    } catch (error) {
      console.error(error);
      setError("I had trouble connecting to the server. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!input.trim() && !file)) return;

    if (!navigator.onLine) {
       setMessages(prev => [...prev, { role: ChatRole.AI, text: "I apologize, but it looks like you are offline. Please check your internet connection and try again." }]);
       return;
    }

    const currentInput = input;
    const currentFile = file;

    const userMessage: Message = {
      role: ChatRole.USER,
      text: currentInput,
      image: currentFile ? URL.createObjectURL(currentFile) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setFile(null);

    await processMessage(currentInput, currentFile);
  };

  const handleRetry = () => {
    if (lastSubmission) {
      processMessage(lastSubmission.text, lastSubmission.file);
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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setCurrentlyPlaying(index);
    utterance.onend = () => setCurrentlyPlaying(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear your chat history for this section? This cannot be undone.")) {
      await storageService.clearMessages(mode);
      setMessages(feature ? [{ role: ChatRole.AI, text: feature.initialMessage }] : []);
      setError(null);
    }
  };

  const handleExportChat = () => {
    const textContent = messages.map(m => `[${m.role.toUpperCase()}]\n${m.text}\n`).join('\n-------------------\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cura-ai-${mode}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-grow bg-white rounded-lg shadow-inner overflow-hidden border border-slate-200 animate-in fade-in duration-300">
      
      {/* Chat Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Info className="w-4 h-4" />
          <span className="font-medium hidden sm:inline">{feature?.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleExportChat}
            className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors text-xs flex items-center gap-1"
            title="Export Chat"
            disabled={isHistoryLoading}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button 
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors text-xs flex items-center gap-1"
            title="Clear Chat History"
            disabled={isHistoryLoading}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <LoadingSpinner />
                <p className="mt-2 text-sm">Loading history...</p>
            </div>
        ) : (
            <>
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
            </>
        )}
        
        {error && (
            <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-100 text-red-600 my-4 animate-in fade-in">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
                <button 
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-100 border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="relative">
          {file && (
            <div className="absolute bottom-full left-0 mb-2 w-auto bg-slate-200 text-slate-700 text-sm py-1 px-3 rounded-full flex items-center gap-2 animate-in slide-in-from-bottom-2">
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
              disabled={isLoading || isHistoryLoading}
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
                  disabled={isLoading || isHistoryLoading}
                  title="Upload Image"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </>
            )}
             {SpeechRecognition && (
                <button
                    type="button"
                    onClick={handleToggleRecording}
                    className={`p-3 rounded-full transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-600 hover:bg-slate-200'}`}
                    disabled={isLoading || isHistoryLoading}
                    title="Voice Input"
                >
                    <Mic className="w-5 h-5" />
                </button>
            )}
            <button
              type="submit"
              className="p-3 rounded-full bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:bg-slate-400 flex-shrink-0 shadow-sm"
              disabled={isLoading || isHistoryLoading || (!input.trim() && !file)}
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
