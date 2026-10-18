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
      alert("Por favor revisa los campos: " + validation.error.issues.map(err => err.message).join(', '));
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
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
        <h3 className="text-xl font-bold font-serif mb-2 text-slate-900 dark:text-slate-100">¡Mensaje enviado con éxito!</h3>
        <p className="text-slate-500 dark:text-slate-400 font-sans">Hemos recibido tus datos. Nos pondremos en contacto contigo muy pronto al correo que nos dejaste.</p>
        <button onClick={() => setContactStatus('idle')} className="mt-8 btn btn-ghost">Enviar otro mensaje</button>
      </div>
    );
  }

  const inputClasses = "px-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all";
  const labelClasses = "text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <form onSubmit={handleContactSubmit} className="flex flex-col gap-5 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Nombre completo *</label>
          <input required type="text" value={contactForm.nombre} onChange={e => setContactForm({...contactForm, nombre: e.target.value})} className={inputClasses} placeholder="Ej. Juan Pérez" />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Correo electrónico *</label>
          <input required type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className={inputClasses} placeholder="juan@empresa.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Teléfono / WhatsApp</label>
          <input type="tel" value={contactForm.telefono} onChange={e => setContactForm({...contactForm, telefono: e.target.value})} className={inputClasses} placeholder="+56 9 1234 5678" />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Rubro o Empresa</label>
          <input type="text" value={contactForm.rubro} onChange={e => setContactForm({...contactForm, rubro: e.target.value})} className={inputClasses} placeholder="Ej. Inmobiliaria, Clínica..." />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>¿En qué podemos ayudarte? *</label>
        <textarea required rows={4} value={contactForm.mensaje} onChange={e => setContactForm({...contactForm, mensaje: e.target.value})} className={`${inputClasses} resize-none`} placeholder="Escribe tu consulta aquí..."></textarea>
      </div>
      
      {contactStatus === 'error' && (
        <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">Hubo un problema enviando el mensaje. Por favor intenta de nuevo.</div>
      )}
      
      <button type="submit" disabled={contactStatus === 'loading'} className="btn btn-primary mt-2 justify-center py-3.5 text-sm">
        {contactStatus === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  );
}
