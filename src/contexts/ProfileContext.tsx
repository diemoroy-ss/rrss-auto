"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export type BusinessProfile = {
  id: string;
  name: string;
  icon?: string;
  network?: string;

  // Entidades Aisladas (Phase 6)
  facebookToken_enc?: string;
  iv_fb?: string;
  tag_fb?: string;
  facebookPageId?: string;
  facebookPageName?: string;
  metaAdAccountId?: string;

  instagramToken_enc?: string;
  iv_ig?: string;
  tag_ig?: string;
  instagramAccountId?: string;
  instagramUsername?: string;

  linkedinClientId_enc?: string;
  linkedinClientSecret_enc?: string;
  linkedinToken_enc?: string;
  linkedinUserToken_enc?: string;
  linkedinPersonUrn?: string;
  linkedinCompanyUrn?: string;
  metaUserToken_enc?: string;
  iv_li_id?: string;
  tag_li_id?: string;
  iv_li_secret?: string;
  tag_li_secret?: string;
  iv_li_token?: string;
  tag_li_token?: string;
  iv_li_user?: string;
  tag_li_user?: string;

  tiktokToken_enc?: string;
  iv_tt?: string;
  tag_tt?: string;
  tiktokUsername?: string;
  
  googleBusinessName?: string;
  googleBusinessToken_enc?: string;
  googleBusinessConnected?: boolean;

  youtubeConnected?: boolean;
  youtubeChannelName?: string;
  youtubeToken_enc?: string;
  youtubeRefreshToken_enc?: string;
  
  xConnected?: boolean;
  xUsername?: string;
  xToken_enc?: string;
  xRefreshToken_enc?: string;

  accounts?: Record<string, any>;
  
  metaTokenExpiresAt?: number;
  linkedinTokenExpiresAt?: number;
  tiktokTokenExpiresAt?: number;

  rubro?: string;
  website?: string;
  businessDescription?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  logoUrl?: string;
  logoPrompt?: string;         // Descripción textual del logo generada por Gemini Vision
  email?: string;
  phone?: string;
  includeWebsiteInCopy?: boolean;
  includeEmailInCopy?: boolean;
  includePhoneInCopy?: boolean;
  alwaysIncludeLogo?: boolean;
  promotions?: string;        // Nivel 1: Promociones y ofertas permanentes/frecuentes del local
  bannerStyle?: 'banner' | 'clean'; // Estilo por defecto: 'banner' (cartel publicitario con textos) o 'clean' (solo foto)
  // Carta Menú Digital & QR
  menuDigitalEnabled?: boolean;
  menuTheme?: 'dark_modern' | 'warm_cafe' | 'fresh_bistro' | 'vibrant_street' | 'minimal_clean';
  isTestProfile?: boolean;
  // Account lock: records which social account IDs have been used in a publish (non-business plan protection)
  accountLocks?: {
    facebook?: string;   // facebookPageId
    instagram?: string;  // instagramAccountId
    tiktok?: string;     // tiktokUsername
  };
};

export type CatalogoItem = {
  id: string;
  name: string;
  description: string;
  type: 'producto' | 'servicio';
  category?: string;
  price?: string;
  offerPrice?: string;
  includePriceInCopy?: boolean;
  imageUrl?: string;
  tags?: string[];
  profileId: string;
  active: boolean;
  createdAt?: any;
  /** Si es true, nuestros agentes usan la foto original sin retocarla ni regenerarla (sólo texto publicitario encima) */
  keepOriginalPhoto?: boolean;
  /** Estilo tipográfico preferido para la sobreposición publicitaria */
  fontStyle?: 'script_handwritten' | 'bold_modern' | 'elegant_serif' | 'clean_minimal';
};


type ProfileContextType = {
  activeProfile: BusinessProfile | null;
  profiles: BusinessProfile[];
  setActiveProfile: (profileId: string) => void;
  addProfile: (name: string, icon: string) => Promise<void>;
  updateActiveProfile: (updates: Partial<BusinessProfile>) => Promise<void>;
  loadProfiles: () => Promise<void>;
  isBusiness: boolean;
  planConfig: any;
  loading: boolean;
};

const ProfileContext = createContext<ProfileContextType>({
  activeProfile: null,
  profiles: [],
  setActiveProfile: () => {},
  addProfile: async () => {},
  updateActiveProfile: async () => {},
  loadProfiles: async () => {},
  isBusiness: false,
  planConfig: null,
  loading: true
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [activeProfileState, setActiveProfileState] = useState<BusinessProfile | null>(null);
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [isBusiness, setIsBusiness] = useState(false);
  const [planConfig, setPlanConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
     if (!auth.currentUser) return;
     try {
       // Fetch User Data
       const userDocRef = doc(db, "users", auth.currentUser.uid);
       const userDoc = await getDoc(userDocRef);
       
       // Fetch Plans Configuration
       const plansDoc = await getDoc(doc(db, "system_config", "plans"));
       const allPlans = plansDoc.exists() ? plansDoc.data() : {};
       
       if (userDoc.exists()) {
          const data = userDoc.data();
          const plan = data.plan || "free";
          
          const currentPlanInfo = allPlans[plan] || allPlans['free'] || {};
          setPlanConfig(currentPlanInfo);
          setIsBusiness(!!currentPlanInfo.multiAccount);

           let userProfiles: BusinessProfile[] = data.profiles || [];
           let needsUpdate = false;

           if (userProfiles.length === 0) {
              const defaultProfile: BusinessProfile = { 
                id: 'default', 
                name: data.company || data.name || 'Mi Cuenta Principal', 
                icon: '🏢'
              };
              userProfiles = [defaultProfile];
              needsUpdate = true;
           }

           // Robust Migration: Merge root data into the FIRST profile if it's missing tokens/data
           const firstP = userProfiles[0];
           if (data.facebookToken_enc && !firstP.facebookToken_enc) {
              firstP.facebookToken_enc = data.facebookToken_enc;
              firstP.iv_fb = data.iv_fb;
              firstP.tag_fb = data.tag_fb;
              firstP.facebookPageId = data.facebookPageId;
              needsUpdate = true;
           }
           if (data.instagramToken_enc && !firstP.instagramToken_enc) {
              firstP.instagramToken_enc = data.instagramToken_enc;
              firstP.iv_ig = data.iv_ig;
              firstP.tag_ig = data.tag_ig;
              firstP.instagramAccountId = data.instagramAccountId;
              needsUpdate = true;
           }
           if (data.website && !firstP.website) { firstP.website = data.website; needsUpdate = true; }
           if (data.facebookUrl && !firstP.facebookUrl) { firstP.facebookUrl = data.facebookUrl; needsUpdate = true; }
           if (data.instagramUrl && !firstP.instagramUrl) { firstP.instagramUrl = data.instagramUrl; needsUpdate = true; }
           if (data.tiktokUrl && !firstP.tiktokUrl) { firstP.tiktokUrl = data.tiktokUrl; needsUpdate = true; }
           if (data.twitterUrl && !firstP.twitterUrl) { firstP.twitterUrl = data.twitterUrl; needsUpdate = true; }
           if (data.linkedinUrl && !firstP.linkedinUrl) { firstP.linkedinUrl = data.linkedinUrl; needsUpdate = true; }
           if (data.logoUrl && !firstP.logoUrl) { firstP.logoUrl = data.logoUrl; needsUpdate = true; }

           if (needsUpdate) {
              updateDoc(userDocRef, { profiles: userProfiles }).catch(console.error);
           }
           
           setProfiles(userProfiles);
          
          // Get saved active profile from localStorage for persistence across reloads
          const savedActiveId = localStorage.getItem(`activeProfile_${auth.currentUser.uid}`);
          const found = userProfiles.find(p => p.id === savedActiveId);
          if (found) {
             setActiveProfileState(found);
          } else {
             setActiveProfileState(userProfiles[0]);
             localStorage.setItem(`activeProfile_${auth.currentUser.uid}`, userProfiles[0].id);
          }
       }
     } catch(e) {
       console.error("Error loading profiles", e);
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadProfiles();
      } else {
        setProfiles([]);
        setActiveProfileState(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const setActiveProfile = (profileId: string) => {
     const p = profiles.find(x => x.id === profileId);
     if (p) {
        setActiveProfileState(p);
        if (auth.currentUser) {
           localStorage.setItem(`activeProfile_${auth.currentUser.uid}`, p.id);
        }
     }
  };

  const addProfile = async (name: string, icon: string) => {
     if (!auth.currentUser) return;
     try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/business/profiles/create", {
           method: "POST",
           headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
           },
           body: JSON.stringify({ name, icon })
        });
        if (!res.ok) throw new Error("Error al crear perfil");
        
        await loadProfiles(); // Reload everything from source of truth
     } catch (e) {
        console.error(e);
        throw e;
     }
  };

  const updateActiveProfile = async (updates: Partial<BusinessProfile>) => {
    if (!auth.currentUser || !activeProfileState) return;
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userProfiles: BusinessProfile[] = data.profiles || [];
        const updatedProfiles = userProfiles.map((p) =>
          p.id === activeProfileState.id ? { ...p, ...updates } : p
        );
        await updateDoc(userDocRef, { profiles: updatedProfiles });
        await loadProfiles();
      }
    } catch (e) {
      console.error("Error updating active profile", e);
      throw e;
    }
  };

  return (
    <ProfileContext.Provider value={{ 
      activeProfile: activeProfileState, 
      profiles, 
      setActiveProfile, 
      addProfile, 
      updateActiveProfile,
      loadProfiles, 
      isBusiness, 
      planConfig,
      loading 
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
