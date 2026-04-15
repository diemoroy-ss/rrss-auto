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
  metaAdAccountId?: string;

  instagramToken_enc?: string;
  iv_ig?: string;
  tag_ig?: string;
  instagramAccountId?: string;

  linkedinClientId_enc?: string;
  linkedinClientSecret_enc?: string;
  linkedinToken_enc?: string;
  linkedinPersonUrn?: string;
  iv_li_id?: string;
  tag_li_id?: string;
  iv_li_secret?: string;
  tag_li_secret?: string;
  iv_li_token?: string;
  tag_li_token?: string;

  rubro?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  logoUrl?: string;
};

type ProfileContextType = {
  activeProfile: BusinessProfile | null;
  profiles: BusinessProfile[];
  setActiveProfile: (profileId: string) => void;
  addProfile: (name: string, icon: string) => Promise<void>;
  loadProfiles: () => Promise<void>;
  isBusiness: boolean;
  loading: boolean;
};

const ProfileContext = createContext<ProfileContextType>({
  activeProfile: null,
  profiles: [],
  setActiveProfile: () => {},
  addProfile: async () => {},
  loadProfiles: async () => {},
  isBusiness: false,
  loading: true
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [activeProfileState, setActiveProfileState] = useState<BusinessProfile | null>(null);
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
     if (!auth.currentUser) return;
     try {
       const userDocRef = doc(db, "users", auth.currentUser.uid);
       const userDoc = await getDoc(userDocRef);
       
       if (userDoc.exists()) {
          const data = userDoc.data();
          const plan = data.plan || "free";
          setIsBusiness(plan === "business");

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

  return (
    <ProfileContext.Provider value={{ activeProfile: activeProfileState, profiles, setActiveProfile, addProfile, loadProfiles, isBusiness, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
