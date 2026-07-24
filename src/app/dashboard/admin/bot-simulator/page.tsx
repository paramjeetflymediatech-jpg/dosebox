'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, MessageSquare, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface BulkTestResult {
  message: string;
  intent: string;
  extractedItems: any[];
  matchedItems: any[];
  reply: string;
  success: boolean;
}

export default function BotSimulatorPage() {
  const [mode, setMode] = useState<'chat' | 'bulk'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi there! Welcome to DoseBox WhatsApp Order Bot. Send me your order (e.g. "I need 10 paracetamol and 5 cough syrups delivered to Mumbai").',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bulk test state
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkTestResult[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (mode === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, mode]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/bot/whatsapp', {
        message: userMsg.text,
        phone: '1234567890',
        userName: 'Test User'
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data?.reply || 'Sorry, I did not understand that.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Error processing your request: ' + (err.response?.data?.reply || err.message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBulkFile(e.target.files[0]);
      setBulkResults([]);
    }
  };

  const runBulkTest = async () => {
    if (!bulkFile) return;
    
    setIsProcessingBulk(true);
    setBulkResults([]);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Simple CSV parse (assuming single column of messages or comma separated)
        const lines = text.split('\n')
                          .map(l => l.trim())
                          .filter(l => l.length > 0)
                          // Remove quotes if they exist around the full line
                          .map(l => l.replace(/^["'](.*)["']$/, '$1'));
                          
        // Take up to 100 lines to prevent accidental massive runs
        const messagesToTest = lines.slice(0, 100);
        
        const res = await api.post('/admin/bot/bulk-test', { messages: messagesToTest });
        if (res.data.success) {
          setBulkResults(res.data.data);
          toast.success(`Processed ${messagesToTest.length} messages`);
        } else {
          toast.error(res.data.message || 'Failed to process bulk messages');
        }
      } catch (err: any) {
        console.error('Bulk test error:', err);
        toast.error('Failed to run bulk test');
      } finally {
        setIsProcessingBulk(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsProcessingBulk(false);
    };
    
    reader.readAsText(bulkFile);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">WhatsApp Bot Simulator</h1>
            <p className="text-slate-500 font-medium">Test & Train natural language ordering</p>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              mode === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Live Chat
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              mode === 'bulk' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Bulk Testing
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        
        {mode === 'chat' && (
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className={`text-[10px] mt-2 block ${msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="flex gap-3">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </>
        )}

        {mode === 'bulk' && (
          <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 border-b border-slate-200 bg-white shrink-0">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bulk-file-upload"
                  />
                  <label 
                    htmlFor="bulk-file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-3" />
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">CSV or TXT (1 message per line, max 100)</p>
                    </div>
                  </label>
                </div>
                
                <div className="w-full md:w-auto flex flex-col gap-3">
                  {bulkFile && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm flex items-center justify-between">
                      <span className="font-medium text-indigo-700 truncate max-w-[200px]">{bulkFile.name}</span>
                      <span className="text-indigo-500 text-xs ml-2">{(bulkFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                  <button
                    onClick={runBulkTest}
                    disabled={!bulkFile || isProcessingBulk}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isProcessingBulk ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
                    ) : (
                      <><Bot className="w-5 h-5" /> Run AI Evaluation</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
              {bulkResults.length === 0 && !isProcessingBulk && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FileText className="w-12 h-12 mb-3 text-slate-300" />
                  <p>Upload a file to see AI evaluation results here.</p>
                </div>
              )}
              
              {bulkResults.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 w-1/3 min-w-[200px]">Original Message</th>
                          <th className="px-4 py-3 whitespace-nowrap">Intent</th>
                          <th className="px-4 py-3 min-w-[150px]">Matches Found</th>
                          <th className="px-4 py-3 w-1/3 min-w-[250px]">Bot Reply (Preview)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkResults.map((result, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              {result.success ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-rose-500" />
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {result.message}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                result.intent === 'ORDER' ? 'bg-indigo-100 text-indigo-700' :
                                result.intent === 'INQUIRY' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {result.intent}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {result.matchedItems.length > 0 ? (
                                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                                  {result.matchedItems.map((item, i) => (
                                    <li key={i}>{item.quantity}x {item.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400 text-xs italic">No matches</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-slate-500 line-clamp-3">
                                {result.reply}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
