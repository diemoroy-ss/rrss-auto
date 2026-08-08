"use client";
import React, { useState } from 'react';
import { ContactFormSchema } from '../lib/schemas';

export default function ContactForm() {
  const [contactForm, setContactForm] = useState({ nombre: '', email: '', telefono: '', rubro: '', mensaje: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod Validation
    const validation = ContactFormSchema.safeParse(contactForm);
    if (!validation.success) {
      alert("Por favor revisa los campos: " + validation.error.errors.map(err => err.message).join(', '));
      return;
    }

    setContactStatus('loading');
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      if (!res.ok) throw new Error("Error sending contact");
      setContactStatus('success');
      setContactForm({ nombre: '', email: '', telefono: '', rubro: '', mensaje: '' });
    } catch (err) {
      console.error(err);
      setContactStatus('error');
    }
  };

  if (contactStatus === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#2C8A4E]/20 text-[#2C8A4E] rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
        <h3 className="text-xl font-bold font-serif mb-2">¡Mensaje enviado con éxito!</h3>
        <p className="text-slate-500 font-sans">Hemos recibido tus datos. Nos pondremos en contacto contigo muy pronto al correo que nos dejaste.</p>
        <button onClick={() => setContactStatus('idle')} className="mt-8 btn btn-ghost">Enviar otro mensaje</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleContactSubmit} className="flex flex-col gap-5 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Nombre completo *</label>
          <input required type="text" value={contactForm.nombre} onChange={e => setContactForm({...contactForm, nombre: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="Ej. Juan Pérez" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Correo electrónico *</label>
          <input required type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="juan@empresa.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Teléfono / WhatsApp</label>
          <input type="tel" value={contactForm.telefono} onChange={e => setContactForm({...contactForm, telefono: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="+56 9 1234 5678" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Rubro o Empresa</label>
          <input type="text" value={contactForm.rubro} onChange={e => setContactForm({...contactForm, rubro: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="Ej. Inmobiliaria, Clínica..." />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">¿En qué podemos ayudarte? *</label>
        <textarea required rows={4} value={contactForm.mensaje} onChange={e => setContactForm({...contactForm, mensaje: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all resize-none" placeholder="Escribe tu consulta aquí..."></textarea>
      </div>
      
      {contactStatus === 'error' && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">Hubo un problema enviando el mensaje. Por favor intenta de nuevo.</div>
      )}
      
      <button type="submit" disabled={contactStatus === 'loading'} className="btn btn-primary mt-2 justify-center py-3.5 text-sm">
        {contactStatus === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  );
}
