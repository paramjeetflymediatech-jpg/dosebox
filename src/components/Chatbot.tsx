'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, ShoppingCart, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  type: 'text' | 'medicine';
  text: string;
  medicines?: any[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      type: 'text',
      text: "👋 Hi there! I'm the DoseBot Assistant. Enter the name of a medicine, and I'll help you find the best purchase option or recommend suitable alternatives if it's unavailable."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { addToCart } = useCart();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');

    // Add user message
    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', type: 'text', text: userText } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText })
      });

      const data = await res.json();

      if (data.success && data.data) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          type: data.data.type,
          text: data.data.message,
          medicines: data.data.medicines
        } as Message]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        type: 'text',
        text: 'Sorry, I am having trouble connecting to the server right now. Please try again later.'
      } as Message]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (medicine: any) => {
    let imageUrl = 'https://images.unsplash.com/photo-1584308666744-24d5e478ac6d?w=800&q=80';
    try {
      const parsedImages = typeof medicine.images === 'string' ? JSON.parse(medicine.images) : medicine.images;
      if (parsedImages && parsedImages.length > 0) imageUrl = parsedImages[0];
    } catch (e) { }

    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: Number(medicine.discountPrice) || Number(medicine.price),
      quantity: 1,
      image: imageUrl,
      prescriptionRequired: medicine.prescriptionRequired || false
    });
    setAddedItems(prev => ({ ...prev, [medicine.id]: true }));
    toast.success(`${medicine.name} added to cart! Check your cart to checkout.`);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[60] flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none ${isOpen
            ? 'bg-slate-800 text-white p-4'
            : 'bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white p-4 shadow-brand-500/40'
          }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed z-[100] flex flex-col bg-white overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-300 
          bottom-24 right-4 w-[calc(100vw-32px)] max-w-[350px] h-[450px] max-h-[75vh] rounded-3xl border border-slate-200
          sm:right-6"
        >

          {/* Header */}
          <div className="bg-brand-600 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-white leading-tight">DoseBot Assistant</h3>
                <p className="text-xs text-brand-100 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online
                </p>
              </div>
            </div>

            {/* Mobile Close Button (visible only on small screens since toggle button might be obscured or awkward) */}
            <button
              onClick={() => setIsOpen(false)}
              className="sm:hidden p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand-100 text-brand-600'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] space-y-2`}>
                  <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none font-medium'}`}>
                    {msg.text}
                  </div>

                  {/* Medicine Cards rendering */}
                  {msg.type === 'medicine' && msg.medicines && (
                    <div className="space-y-3 mt-2 w-full">
                      {msg.medicines.map((med: any) => {
                        let img = 'https://images.unsplash.com/photo-1584308666744-24d5e478ac6d?w=800&q=80';
                        try {
                          const parsed = typeof med.images === 'string' ? JSON.parse(med.images) : med.images;
                          if (parsed && parsed.length > 0) img = parsed[0];
                        } catch (e) { }

                        return (
                          <div key={med.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-3 w-[260px] sm:w-[280px]">
                            <div className="flex gap-3 items-start">
                              <img src={img} alt={med.name} className="w-16 h-16 object-cover rounded-lg border border-slate-100" />
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{med.name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{med.composition || med.manufacturer || 'General Medicine'}</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{med.packSize || '1 Pack'}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                              <div>
                                <p className="text-[10px] text-slate-400 line-through">₹{formatCurrency(Number(med.price))}</p>
                                <p className="text-sm font-black text-brand-600">₹{formatCurrency(Number(med.discountPrice || med.price))}</p>
                              </div>

                              {addedItems[med.id] ? (
                                <Link href="/cart" onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Check Cart
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleAddToCart(med)}
                                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <ShoppingCart className="w-3 h-3" /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-slate-200 shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a medicine name..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all text-sm font-medium text-slate-700"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
