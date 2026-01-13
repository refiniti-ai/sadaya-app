import React, { useState, useRef, useEffect } from 'react';
import { chatSupport } from '../services/geminiService';
import { MessageSquare, X, Send, User, Bot } from 'lucide-react';

export const SupportBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([
        {sender: 'bot', text: 'Hello, I am Varia. How can I assist you with your operations today?'}
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, {sender: 'user', text: userMsg}]);
        setInput('');
        setIsTyping(true);

        // Convert format for Gemini history
        const history = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const response = await chatSupport(history, userMsg);
        
        setIsTyping(false);
        setMessages(prev => [...prev, {sender: 'bot', text: response}]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-sadaya-gold to-sadaya-tan rounded-full shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}

            {isOpen && (
                <div className="w-[350px] h-[500px] glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="p-4 bg-gradient-to-r from-sadaya-gold/20 to-sadaya-tan/20 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                            <span className="font-display font-bold text-white">VARIA SUPPORT</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                    m.sender === 'user' 
                                    ? 'bg-sadaya-tan text-white rounded-br-none' 
                                    : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/5'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 px-3 py-2 rounded-lg rounded-bl-none flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-black/40 border-t border-white/10">
                        <div className="relative">
                            <input 
                                type="text"
                                className="w-full bg-slate-800 border border-slate-600 rounded-full pl-4 pr-10 py-2 text-sm text-white focus:border-sadaya-gold focus:outline-none"
                                placeholder="Ask Varia..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button 
                                onClick={handleSend}
                                className="absolute right-2 top-1.5 p-1 bg-sadaya-gold rounded-full text-black hover:bg-white transition-colors"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="text-[10px] text-center text-slate-600 mt-2">
                            Varia Agent v2.5 • <span className="underline cursor-pointer hover:text-slate-400">Escalate to Human</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
