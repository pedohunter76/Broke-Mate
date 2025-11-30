import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface AIChatProps {
  // Empty props for now, could take context in future
}

const AIChat: React.FC<AIChatProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am Nexus AI. I can help you analyze your finances, plan your schedule, or answer any questions. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "I'm having trouble connecting right now. Please try again.",
            timestamp: new Date(),
            isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-white font-semibold">Nexus Assistant</h2>
                <p className="text-xs text-indigo-300">Powered by Gemini 3 Pro</p>
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none'
            } ${msg.isError ? 'bg-rose-100 text-rose-800 border border-rose-200' : ''}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <span className={`text-[10px] mt-2 block opacity-60 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative flex items-center">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for financial advice or schedule help..."
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
            />
            <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;