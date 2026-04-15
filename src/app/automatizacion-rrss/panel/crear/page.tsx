"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from "../../../../lib/quota";

import PostConfigForm from "../../../../components/crear/PostConfigForm";
import CarouselWizard, { CarouselSlide } from "../../../../components/crear/CarouselWizard";

export default function RrssCreatePost() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [hasFb, setHasFb] = useState(false);
  const [hasIg, setHasIg] = useState(false);
  const [hasLi, setHasLi] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [manualCaption, setManualCaption] = useState("");
  const [idea, setIdea] = useState("");
  const [postType, setPostType] = useState("Post");
  const [carouselCount, setCarouselCount] = useState(3);
  const [businessType, setBusinessType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [networks, setNetworks] = useState({ facebook: true, instagram: true, linkedin: true });

  // Wizard state
  const [previewSlides, setPreviewSlides] = useState<CarouselSlide[]>([]);
  const [userLogo, setUserLogo] = useState("");

  const [previewLoading, setPreviewLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);

  const [userPlan, setUserPlan] = useState("free");
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const { activeProfile } = useProfile();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        try {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) {
            const data = d.data();
            const isDefault = activeProfile?.id === 'default';
            const fbOK = !!activeProfile?.facebookToken_enc || (isDefault && !!data.facebookToken_enc);
            const igOK = !!activeProfile?.instagramToken_enc || (isDefault && !!data.instagramToken_enc);
            const liOK = !!activeProfile?.linkedinToken_enc || (isDefault && !!data.linkedinToken_enc);
            
            setHasFb(fbOK);
            setHasIg(igOK);
            setHasLi(liOK);
            setBusinessType(activeProfile?.rubro || (isDefault ? data.rubro : "") || "");
            setUserLogo(activeProfile?.logoUrl || (isDefault ? data.logoUrl : "") || "");
            
            setNetworks({ facebook: fbOK, instagram: igOK, linkedin: liOK });
            
            const plan = data.plan || "free";
            setUserPlan(plan);

            const used = await getQuotaUsage(u.uid, activeProfile?.id || 'default');
            setPostsThisMonth(used);
            
            const planLimit = getPlanLimit(plan);
            if (used >= planLimit) {
                setQuotaExceeded(true);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoadingInitial(false);
    });
    return () => unsub();
  }, [activeProfile?.id]);

  const handleImproveWithAI = async () => {
    if (!idea) { setError("Por favor ingresa una idea base para mejorarla."); return; }
    setImproveLoading(true);
    setError("");
    try {
      const response = await fetch('/api/ai/improve-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, businessType })
      });
      if (!response.ok) throw new Error("Error en mejora IA");
      const data = await response.json();
      setIdea(data.improvedIdea);
    } catch (err) {
      console.error(err);
      setError("No pudimos mejorar la idea. Intenta nuevamente.");
    } finally {
      setImproveLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!idea) { setError("Por favor ingresa una idea para generar la previsualización."); return; }
    setPreviewLoading(true);
    setError("");
    try {
      const response = await fetch('/api/ai/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          userPlan,
          businessType,
          type: postType,
          carouselCount: postType === 'Carrusel' ? carouselCount : 1,
          userId: user?.uid,
          profileId: activeProfile?.id || 'default'
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error en n8n");
      }
      
      const data = await response.json();
      const newSlides: CarouselSlide[] = [];
      
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
          data.imageUrls.forEach((url: string) => {
              newSlides.push({ url, copy: data.suggestedCopy || idea });
          });
      } else if (data.imageUrl) {
          newSlides.push({ url: data.imageUrl, copy: data.suggestedCopy || idea });
      }

      if (newSlides.length === 0) {
          throw new Error("No se devolvieron imágenes desde n8n.");
      }

      setPreviewSlides(newSlides);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "No pudimos generar la previsualización. Revisa tu conexión.");
    } finally {
        setPreviewLoading(false);
    }
  };

  const updateSlideFinalUrl = (slideIndex: number, finalUrl: string) => {
      setPreviewSlides(prev => {
          const copy = [...prev];
          if (copy[slideIndex]) {
              copy[slideIndex].finalUrl = finalUrl;
          }
          return copy;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationMode === 'ai' && !idea) { setError("Por favor ingresa una idea para tu publicación."); return; }
    if (creationMode === 'manual' && manualFiles.length === 0) { setError("Sube al menos un archivo para tu publicación."); return; }
    if (!date || !time) { setError("Selecciona fecha y hora para agendar."); return; }
    
    const nets: string[] = [];
    if (networks.facebook && hasFb) nets.push('facebook');
    if (networks.instagram && hasIg) nets.push('instagram');
    if (networks.linkedin && hasLi) nets.push('linkedin');

    if (nets.length === 0 && (hasFb || hasIg || hasLi)) { 
        setError("Selecciona al menos una red social destino."); 
        return; 
    }

    setLoading(true);
    setError("");

    try {
      const scheduledDate = new Date(`${date}T${time}:00`);
      if (scheduledDate < new Date()) {
          setError("La fecha agendada debe ser en el futuro.");
          setLoading(false);
          return;
      }

      let finalUrls: string[] = [];

      if (creationMode === 'manual') {
          // Upload manual files directly to Storage
          const { storage } = await import('../../../../lib/firebase');
          for (let i = 0; i < manualFiles.length; i++) {
              const file = manualFiles[i];
              const ext = file.name.split('.').pop();
              const filename = `manual_post_\${Date.now()}_\${i}.\${ext}`;
              const storageRef = ref(storage, `social_media_uploads/\${user.uid}/\${filename}`);
              await uploadBytes(storageRef, file);
              const url = await getDownloadURL(storageRef);
              finalUrls.push(url);
          }
      } else {
          finalUrls = previewSlides.map(slide => slide.finalUrl || slide.url);
      }

      const postPayload: any = {
        userId: user.uid,
        profileId: activeProfile?.id || 'default',
        idea: creationMode === 'manual' ? 'Subida manual: ' + manualCaption.slice(0, 50) : idea,
        type: postType,
        carouselCount: postType === 'Carrusel' ? carouselCount : 1,
        businessType,
        scheduledFor: scheduledDate,
        networks: nets,
        status: 'pending',
        createdAt: new Date(),
        copy: creationMode === 'manual' ? manualCaption : (previewSlides[0]?.copy || idea),
        generatedBy: creationMode === 'manual' ? 'manual' : 'ai'
      };

      if (finalUrls.length > 0) {
          postPayload.imageUrl = finalUrls[0];
          if (finalUrls.length > 1) {
              postPayload.imageUrls = finalUrls;
          }
      } else {
          postPayload.imageUrl = "";
      }

      await addDoc(collection(db, "social_posts"), postPayload);
      router.push("/automatizacion-rrss/panel");

    } catch (err) {
      console.error(err);
      setError("Error programando el post. Intenta nuevamente.");
      setLoading(false);
    }
  };

  if (loadingInitial) return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;
  const needsConnection = !hasFb && !hasIg && !hasLi;

  return (
    <div className="max-w-[1400px] mx-auto lg:mx-0">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nueva Publicación</h1>
        <p className="text-slate-500 mt-3 font-medium text-lg">Danos una idea y el bot se encarga del diseño (IA) y la publicación.</p>
      </div>

      {quotaExceeded && (
        <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[28px] animate-in slide-in-from-top-4 shadow-sm flex items-start gap-4">
           <div className="text-3xl">⚠️</div>
           <div>
              <h3 className="text-rose-900 font-black tracking-tight">Límite Mensual Alcanzado ({postsThisMonth} Publicaciones)</h3>
              <p className="text-rose-700/80 font-medium text-sm mt-1">Has consumido todas tus publicaciones automáticas del mes. Podrás guardar esta nueva idea como <b>Borrador</b>, pero el bot no la publicará hasta tu próximo ciclo mensual o hasta que <Link href="/automatizacion-rrss/panel/planes" className="underline font-bold text-rose-600 hover:text-rose-800">mejores tu plan actual</Link>.</p>
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8 max-w-2xl w-full">
            <PostConfigForm 
              idea={idea} setIdea={setIdea}
              postType={postType} setPostType={setPostType}
              carouselCount={carouselCount} setCarouselCount={setCarouselCount}
              businessType={businessType} setBusinessType={setBusinessType}
              date={date} setDate={setDate}
              time={time} setTime={setTime}
              networks={networks} setNetworks={setNetworks}
              hasFb={hasFb} hasIg={hasIg} hasLi={hasLi}
              needsConnection={needsConnection}
              handleImproveWithAI={handleImproveWithAI}
              handleGeneratePreview={handleGeneratePreview}
              handleSubmit={handleSubmit}
              improveLoading={improveLoading}
              previewLoading={previewLoading}
              loading={loading}
              error={error}
              allowVideo={getVideoPlanLimit(userPlan) > 0}
              creationMode={creationMode}
              setCreationMode={setCreationMode}
              manualFiles={manualFiles}
              setManualFiles={setManualFiles}
              manualCaption={manualCaption}
              setManualCaption={setManualCaption}
            />
          </div>

          <div className="lg:col-span-5 relative">
            {creationMode === 'manual' ? (
                <div className="p-8 border-4 border-dashed border-indigo-100 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-indigo-400 bg-indigo-50/20 lg:sticky lg:top-24 mt-8 lg:mt-0 transition-all">
                  <div className="text-6xl mb-4 opacity-80">📱</div>
                  <h4 className="font-black text-lg mb-2 text-indigo-700">Subida Directa Activada</h4>
                  <p className="font-medium text-sm max-w-xs leading-relaxed">Tus archivos se subirán directamente sin usar nuestra IA. Asegúrate de que el formato sea correcto. Presiona "Automatizar y Publicar" abajo para finalizar.</p>
                </div>
            ) : previewSlides.length > 0 ? (
                postType === 'Reel' ? (
                   <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
                     <div className="rounded-[32px] overflow-hidden shadow-2xl relative bg-black aspect-[9/16] max-h-[80vh] max-w-[400px] mx-auto flex items-center justify-center border-4 border-slate-900 ring-4 ring-indigo-500/20">
                       <video src={previewSlides[0].url} autoPlay loop muted playsInline controls className="w-full h-full object-cover" />
                       <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                          Reel Generado
                       </div>
                     </div>
                     <button form="create-post-form" disabled={loading} type="submit" className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-lg py-5 px-8 rounded-[24px] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-4 hover:-translate-y-1">
                       {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Aprobar y Agendar'}
                     </button>
                   </div>
                ) : (
                   <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
                     <CarouselWizard 
                        slides={previewSlides}
                        onUpdateSlide={updateSlideFinalUrl}
                        userLogo={userLogo}
                        userId={user?.uid}
                     />
                     <button form="create-post-form" disabled={loading} type="submit" className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-lg py-5 px-8 rounded-[24px] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-4 hover:-translate-y-1">
                       {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Aprobar y Agendar'}
                     </button>
                   </div>
                )
            ) : previewLoading ? (
                <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-indigo-700 lg:sticky lg:top-24 mt-8 lg:mt-0 shadow-lg shadow-indigo-100/50 animate-pulse">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                  <h4 className="font-black text-lg mb-2 uppercase tracking-widest">Generando Diseño...</h4>
                  <p className="font-medium text-sm max-w-xs leading-relaxed text-indigo-500">Estamos hablando con nuestra IA y renderizando tus imágenes. Esto puede tomar unos segundos.</p>
                </div>
            ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-slate-400 lg:sticky lg:top-24 mt-8 lg:mt-0 transition-all hover:bg-slate-50 hover:border-slate-300">
                  <div className="text-6xl mb-4 opacity-50">🖼️</div>
                  <h4 className="font-black text-lg mb-2 text-slate-600">Área de Visualización</h4>
                  <p className="font-medium text-sm max-w-xs leading-relaxed">Describe tu idea a la izquierda y presiona "Ver Previsualización" para ver cómo quedará tu post.</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
