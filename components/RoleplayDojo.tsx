import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Unit } from '../types';
import { geminiService } from '../services/geminiService';
import { Send, User as UserIcon, Bot } from 'lucide-react';
import { Chat } from '@google/genai';

interface RoleplayDojoProps {
  unit: Unit;
  onComplete: () => void;
  onExit: () => void;
}

export const RoleplayDojo: React.FC<RoleplayDojoProps> = ({ unit, onComplete, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chat
    if (unit.aiPrompt) {
      chatSession.current = geminiService.createRoleplaySession(unit.aiPrompt);
      // Initial greeting from AI
      setIsLoading(true);
      chatSession.current.sendMessage({ message: "Start the roleplay." })
        .then(response => {
           setMessages([{ role: 'model', text: response.text || "Hello." }]);
           setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }
  }, [unit]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg.text });
      const botMsg: ChatMessage = { role: 'model', text: result.text || "..." };
      setMessages(prev => [...prev, botMsg]);
      
      // Simple logic to end roleplay after 5 exchanges for demo
      if (messages.length > 8) {
        onComplete();
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-brand-600 p-4 text-white flex justify-between items-center">
        <div>
            <h2 className="font-bold text-lg">{unit.title}</h2>
            <p className="text-xs opacity-90">Roleplay Mode</p>
        </div>
        <button onClick={onExit} className="text-xs bg-brand-700 hover:bg-brand-800 px-3 py-1 rounded">
            Exit
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              flex items-start max-w-[80%] 
              ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
            `}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2
                ${msg.role === 'user' ? 'bg-brand-500' : 'bg-recovery-purple'}
              `}>
                {msg.role === 'user' ? <UserIcon size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}
              </div>
              <div className={`
                p-3 rounded-2xl text-sm shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-brand-100 text-brand-900 rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start w-full">
                <div className="ml-12 text-xs text-slate-400 animate-pulse">Narrator is typing...</div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your response..."
            className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white p-2 rounded-full transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};