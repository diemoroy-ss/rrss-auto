import { useState, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { 
  getQuotaUsage, 
  getPlanLimit, 
  getVideoPlanLimit, 
  getAiGenerationUsage, 
  getAiPlanLimit,
  fetchUserQuotas 
} from "../lib/quota";
import { SocialPost } from "../types/dashboard";

interface UseQuotaReturn {
  userPlan: string;
  quotaUsed: number;
  setQuotaUsed: React.Dispatch<React.SetStateAction<number>>;
  planLimit: number;
  videoLimit: number;
  imagesUsed: number;
  imageLimit: number;
  videosUsed: number;
  refreshQuota: () => Promise<void>;
  /** Cuenta de posts de tipo reel/video en el array de posts actual */
  getVideosUsed: (posts: SocialPost[]) => number;
}

/**
 * useQuota
 * Carga y mantiene el estado de cuotas del usuario activo:
 * - Plan actual (free / starter / growth / pro / business)
 * - Posts usados este mes (quotaUsed) vs límite (planLimit)
 * - Imágenes generadas por agentes (imagesUsed) vs límite (imageLimit)
 * - Videos/reels generados por agentes (videosUsed) vs límite (videoLimit)
 *
 * Se sincroniza automáticamente cuando cambia el profileId activo.
 */
export function useQuota(profileId: string | undefined): UseQuotaReturn {
  const [userPlan, setUserPlan] = useState<string>("free");
  const [quotaUsed, setQuotaUsed] = useState<number>(0);
  const [planLimit, setPlanLimit] = useState<number>(5);
  const [videoLimit, setVideoLimit] = useState<number>(0);
  const [imagesUsed, setImagesUsed] = useState<number>(0);
  const [imageLimit, setImageLimit] = useState<number>(8);
  const [videosUsed, setVideosUsed] = useState<number>(0);

  const fetchQuotas = useCallback(async (u: any) => {
    if (!u) return;
    try {
      const serverQuotas = await fetchUserQuotas(profileId || "default");
      if (serverQuotas) {
        setUserPlan(serverQuotas.plan);
        setQuotaUsed(serverQuotas.postsUsed);
        setPlanLimit(serverQuotas.postsLimit);
        setVideoLimit(serverQuotas.videoLimit);
        setImagesUsed(serverQuotas.imagesUsed);
        setImageLimit(serverQuotas.imageLimit);
        setVideosUsed(serverQuotas.videosUsed);
        return;
      }

      const d = await getDoc(doc(db, "users", u.uid));
      const plan = d.data()?.plan || "free";
      setUserPlan(plan);

      const [usedPosts, pLimit, vLimit, imgUsed, imgLimit, vidUsed] = await Promise.all([
        getQuotaUsage(u.uid, profileId || "default"),
        getPlanLimit(plan, u.email),
        getVideoPlanLimit(plan, u.email),
        getAiGenerationUsage(u.uid, "image"),
        getAiPlanLimit(plan, "image", u.email),
        getAiGenerationUsage(u.uid, "video"),
      ]);

      setQuotaUsed(usedPosts);
      setPlanLimit(pLimit);
      setVideoLimit(vLimit);
      setImagesUsed(imgUsed);
      setImageLimit(imgLimit);
      setVideosUsed(vidUsed);
    } catch (err) {
      console.warn("[useQuota] Aviso cargando cuotas:", err);
    }
  }, [profileId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) fetchQuotas(u);
    });
    return () => unsub();
  }, [fetchQuotas]);

  const refreshQuota = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await fetchQuotas(currentUser);
    }
  }, [fetchQuotas]);

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
    imagesUsed,
    imageLimit,
    videosUsed,
    refreshQuota,
    getVideosUsed,
  };
}
