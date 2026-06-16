'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import QuickPrompts from "./QuickPrompts";

export default function TalkToDataPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Halo! Saya AI asisten SAVORI. Anda bisa bertanya apa saja tentang data penjualan, analisis produk, atau prediksi performa cabang.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/talk-to-data/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          branchIds: ['Sudirman', 'Kemang', 'Blok M'], // mock context
          dateRange: { from: '2026-06-01', to: '2026-06-30' },
          conversationHistory: messages.filter(m => m.id !== 'welcome')
        })
      });

      const result = await response.json();
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: result.explanation || 'Maaf, saya tidak dapat menganalisis data tersebut.',
        chartType: result.chartType,
        chartData: result.results,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Terjadi kesalahan saat memproses permintaan Anda.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-50 animate-in zoom-in"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Side Panel */}
      {isOpen && (
        <Card className="fixed top-0 right-0 w-full md:w-[450px] h-full h-screen shadow-2xl border-l border-border flex flex-col z-50 rounded-none bg-main animate-in slide-in-from-right-full duration-300">
          {/* Header */}
          <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Talk to Data</h3>
                <p className="text-xs text-text-secondary">AI Business Analyst</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-primary rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-text-secondary mb-4 p-3 bg-white rounded-2xl rounded-bl-sm border w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Sedang menganalisis data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white p-4 border-t">
            <QuickPrompts onSelect={(prompt) => handleSend(prompt)} />
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 relative"
            >
              <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanyakan performa bisnis..." 
                className="pr-12 py-6 bg-main border-none focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1.5 h-9 w-9 rounded-full bg-primary hover:bg-primary-hover text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
}
