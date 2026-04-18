"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

type ChatSession = {
  phone: string;
  pushName: string;
  updatedAt: string | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  createdAt: string | null;
};

export default function AdminWhatsAppPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
         router.push("/automatizacion-rrss/panel");
         return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch("/api/admin/whatsapp", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
           router.push("/automatizacion-rrss/panel");
           return;
        }

        const data = await res.json();
        setChats(data.chats);
      } catch (e: any) {
         console.error(e);
         setError(e.message || "Error al cargar la lista de chats.");
      } finally {
         setLoadingChats(false);
      }
    });

    return () => unsub();
  }, [router]);

  const loadConversation = async (chat: ChatSession) => {
      setSelectedChat(chat);
      setLoadingMessages(true);
      
      try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`/api/admin/whatsapp/${chat.phone}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error("Error fetching messages");
          
          const data = await res.json();
          setMessages(data.messages);
      } catch (e) {
          console.error(e);
          alert("Error al cargar la conversación");
      } finally {
          setLoadingMessages(false);
      }
  };

  if (loadingChats) return <div className="text-center font-bold text-slate-400 mt-20">Cargando Historial de WhatsApp...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[80vh] flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Canal <span className="text-emerald-500">WhatsApp.</span></h1>
        <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed italic">Monitoreo de conversaciones IA en tiempo real.</p>
      </div>

      {error ? (
        <div className="p-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm border border-rose-100 mb-6">⚠️ {error}</div>
      ) : (
        <div className="premium-card !p-0 overflow-hidden flex flex-1 border border-slate-200 shadow-sm min-h-0">
          
          {/* Sidebar: Chat List */}
          <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
             <div className="p-4 border-b border-slate-200 bg-white sticky top-0 font-black text-xs text-slate-400 uppercase tracking-widest z-10">
                 Hilos Activos ({chats.length})
             </div>
             <div className="divide-y divide-slate-200">
                {chats.map(chat => (
                    <button 
                       key={chat.phone}
                       onClick={() => loadConversation(chat)}
                       className={`w-full text-left p-4 hover:bg-white transition-colors block ${selectedChat?.phone === chat.phone ? 'bg-white border-l-4 border-emerald-500' : 'border-l-4 border-transparent'}`}
                    >
                       <div className="font-bold text-slate-900">{chat.pushName}</div>
                       <div className="text-[10px] text-slate-500 font-medium mt-1">{chat.phone.replace('@s.whatsapp.net', '')}</div>
                       <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-2">
                           {chat.updatedAt ? new Date(chat.updatedAt).toLocaleString() : 'Sin Fecha'}
                       </div>
                    </button>
                ))}
                {chats.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs font-black uppercase tracking-widest italic">
                        No hay conversaciones registradas
                    </div>
                )}
             </div>
          </div>

          {/* Main Area: Conversation View */}
          <div className="w-2/3 bg-slate-100 flex flex-col relative">
             {selectedChat ? (
                 <>
                    {/* Header */}
                    <div className="bg-white p-4 border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <div className="font-black text-slate-900">{selectedChat.pushName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{selectedChat.phone.replace('@s.whatsapp.net', '')}</div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                           IA Activa
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loadingMessages ? (
                            <div className="text-center font-bold text-slate-400 mt-10 text-sm">Cargando mensajes...</div>
                        ) : (
                            messages.map((msg, i) => {
                                const isAI = msg.role === 'ai';
                                return (
                                    <div key={i} className={`flex ${isAI ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-medium shadow-sm ${
                                            isAI 
                                            ? 'bg-emerald-100 text-emerald-900 rounded-tr-sm border border-emerald-200' 
                                            : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                                        }`}>
                                            <div className="whitespace-pre-wrap">{msg.text}</div>
                                            <div className={`text-[9px] mt-2 text-right uppercase tracking-widest font-black opacity-50`}>
                                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        {messages.length === 0 && !loadingMessages && (
                             <div className="text-center font-bold text-slate-400 mt-10 text-xs uppercase tracking-[0.2em] italic">
                                 No hay historial de mensajes
                             </div>
                        )}
                    </div>
                 </>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                     <span className="text-6xl mb-4">💬</span>
                     <h3 className="text-lg font-black text-slate-600 mb-2">Selecciona un chat</h3>
                     <p className="text-sm font-medium max-w-sm">Haz clic en uno de los hilos de la izquierda para explorar la conversación entre el usuario y la IA.</p>
                 </div>
             )}
          </div>
          
        </div>
      )}
    </div>
  );
}
