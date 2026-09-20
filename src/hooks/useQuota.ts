import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from "../lib/quota";
import { SocialPost } from "../types/dashboard";

interface UseQuotaReturn {
  userPlan: string;
  quotaUsed: number;
  setQuotaUsed: React.Dispatch<React.SetStateAction<number>>;
  planLimit: number;
  videoLimit: number;
  /** Cuenta de posts de tipo reel/video en el array de posts actual */
  getVideosUsed: (posts: SocialPost[]) => number;
}

/**
 * useQuota
 * Carga y mantiene el estado de cuotas del usuario activo:
 * - Plan actual (free / starter / growth / pro / business)
 * - Posts usados este mes (quotaUsed)
 * - Límite de posts del plan (planLimit)
 * - Límite de videos/reels del plan (videoLimit)
 *
 * Se sincroniza automáticamente cuando cambia el profileId activo.
 */
export function useQuota(profileId: string | undefined): UseQuotaReturn {
  const [userPlan, setUserPlan] = useState<string>("free");
  const [quotaUsed, setQuotaUsed] = useState<number>(0);
  const [planLimit, setPlanLimit] = useState<number>(4);
  const [videoLimit, setVideoLimit] = useState<number>(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        const d = await getDoc(doc(db, "users", u.uid));
        const plan = d.data()?.plan || "free";
        setUserPlan(plan);

        const [used, pLimit, vLimit] = await Promise.all([
          getQuotaUsage(u.uid, profileId || "default"),
          getPlanLimit(plan, u.email),
          getVideoPlanLimit(plan, u.email),
        ]);

        setQuotaUsed(used);
        setPlanLimit(pLimit);
        setVideoLimit(vLimit);
      } catch (err) {
        console.error("[useQuota] Error cargando cuotas:", err);
      }
    });

    return () => unsub();
  }, [profileId]);

  const getVideosUsed = useMemo(
    () => (posts: SocialPost[]) =>
      posts.filter((p) => {
        const t = p.type?.toLowerCase() ?? "";
        return t.includes("reel") || t.includes("video");
      }).length,
    []
  );

  return {
    userPlan,
    quotaUsed,
    setQuotaUsed,
    planLimit,
    videoLimit,
    getVideosUsed,
  };
}
