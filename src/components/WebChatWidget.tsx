"use client";

import { useState, useEffect, useRef } from "react";

export default function WebChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Chat State
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const storedName = localStorage.getItem("santisoft_chat_name");
    const storedPhone = localStorage.getItem("santisoft_chat_phone");
    if (storedName && storedPhone) {
      setName(storedName);
      setPhone(storedPhone);
      setIsRegistered(true);
      // Optional: We could load previous messages from an endpoint here, but for simplicity we start fresh in the UI 
      // (the AI backend will remember the context via Firestore).
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      localStorage.setItem("santisoft_chat_name", name.trim());
      localStorage.setItem("santisoft_chat_phone", phone.trim());
      setIsRegistered(true);
      
      // Auto-gretting from bot
      setMessages([{ role: 'ai', text: `¡Hola ${name.split(" ")[0]}! Soy el asistente virtual de Santisoft. ¿En qué te puedo ayudar hoy?` }]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/webchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, text: userMessage })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en el servidor");
      
      const fullReply = data.reply;
      
      // Simular escritura fragmentada
      const chunks = fullReply.split(/\n\n+/).filter((c: string) => c.trim().length > 0);
      
      for (const chunk of chunks) {
          setMessages(prev => [...prev, { role: 'ai', text: chunk }]);
          if (chunks.length > 1) {
              await new Promise(r => setTimeout(r, 600));
          }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: error.message || "Lo siento, tuve un problema de conexión. ¿Podrías intentar de nuevo?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 group"
          aria-label="Abrir Asistente"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300">
            {/* Message Square Icon */}
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
          </svg>
          <span className="absolute right-20 bg-white text-slate-800 text-sm font-bold py-2 px-4 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block border border-slate-100">
            👋 Chatea con IA
          </span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden transform origin-bottom-right transition-all">
          
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0 shadow-md z-10">
             <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                   <h3 className="font-bold tracking-tight">Santisoft Asistente</h3>
                   <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> En Línea
                   </p>
                </div>
             </div>
             <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cerrar chat"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>

          {!isRegistered ? (
             /* Formulario de Captura de Leads */
             <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">👋</div>
                <h4 className="text-lg font-black text-slate-900 mb-2">¡Comencemos a hablar!</h4>
                <p className="text-sm font-medium text-slate-500 mb-6">Por favor, indícanos tu nombre y número para brindarte una mejor atención.</p>
                
                <form onSubmit={handleRegister} className="w-full space-y-3">
                   <input 
                      type="text" 
                      required 
                      placeholder="Tu Nombre" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                   />
                   <input 
                      type="tel" 
                      required 
                      placeholder="Teléfono (ej: +56912345678)" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                   />
                   <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors mt-2">
                      Iniciar Chat
                   </button>
                </form>
             </div>
          ) : (
             /* Interfaz de Chat Activa */
             <>
                <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4">
                   {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] p-3 text-sm font-medium shadow-sm ${
                           msg.role === 'user' 
                           ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                           : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm'
                         }`}>
                            {msg.text}
                         </div>
                      </div>
                   ))}
                   {isLoading && (
                      <div className="flex justify-start">
                         <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-xs font-black uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-sm">
                            Escribiendo <span className="flex space-x-1 ml-1"><span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span><span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-100"></span><span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-200"></span></span>
                         </div>
                      </div>
                   )}
                   <div ref={messagesEndRef} />
                </div>

                {/* Área de Input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                   <input 
                      type="text" 
                      placeholder="Escribe tu mensaje..." 
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-indigo-500 disabled:bg-slate-50"
                   />
                   <button 
                      type="submit" 
                      disabled={!inputText.trim() || isLoading}
                      className="w-10 h-10 shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                      aria-label="Enviar Mensaje"
                   >
                     <svg className="w-4 h-4 translate-x-px" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                     </svg>
                   </button>
                </form>
             </>
          )}
        </div>
      )}
    </div>
  );
}
