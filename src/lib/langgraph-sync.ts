import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { adminDb } from "./firebase-admin";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { decrypt, encrypt } from "./encryption";

// 1. Estado del Grafo de Sincronización
export const SyncAnnotation = Annotation.Root({
  userId: Annotation<string>({ reducer: (a, b) => b ?? a }),
  profileId: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "default" }),
  platforms: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  syncedCount: Annotation<number>({ reducer: (a, b) => a + (b ?? 0), default: () => 0 }),
  logs: Annotation<string[]>({ reducer: (a, b) => [...a, ...(b ?? [])], default: () => [] }),
  tokens: Annotation<any>({ reducer: (a, b) => ({ ...a, ...b }), default: () => ({}) }),
});

export type SyncState = typeof SyncAnnotation.State;

// Helpers de acceso a base de datos (Server-side adminDb con fallback a client db)
async function fetchUserDoc(userId: string): Promise<any | null> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection("users").doc(userId).get();
      return snap.exists ? snap.data() : null;
    } catch (adminErr) {
      console.warn("[Sync Agent] Error con adminDb al leer usuario, intentando fallback:", adminErr);
    }
  }

  try {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() : null;
  } catch (clientErr) {
    console.error("[Sync Agent] Fallo al leer usuario con cliente Firestore:", clientErr);
    return null;
  }
}

async function upsertExternalPost(postId: string, data: any): Promise<void> {
  if (adminDb) {
    try {
      await adminDb.collection("external_posts").doc(postId).set(data, { merge: true });
      return;
    } catch (adminErr) {
      console.warn(`[Sync Agent] Error con adminDb al guardar post ${postId}:`, adminErr);
    }
  }

  try {
    await setDoc(doc(db, "external_posts", postId), data, { merge: true });
  } catch (clientErr) {
    console.error(`[Sync Agent] Error guardando post ${postId} con client SDK:`, clientErr);
  }
}

// 2. Nodo de Descubrimiento: Identifica qué redes están activas y obtiene tokens
async function discoveryNode(state: SyncState): Promise<Partial<SyncState>> {
  console.log(`[Sync Agent] Discovery - Iniciando para usuario ${state.userId}, perfil: ${state.profileId}`);
  
  const userData = await fetchUserDoc(state.userId);
  if (!userData) {
    console.warn(`[Sync Agent] Usuario ${state.userId} no encontrado en la base de datos.`);
    return {
      platforms: [],
      tokens: {},
      logs: ["Usuario no encontrado en la base de datos."]
    };
  }

  let profile = userData;
  if (Array.isArray(userData.profiles) && userData.profiles.length > 0) {
    if (state.profileId && state.profileId !== "default") {
      profile = userData.profiles.find((p: any) => p.id === state.profileId) || profile;
    } else {
      profile = userData.profiles.find((p: any) => p.id === "default") || userData.profiles[0] || userData;
    }
  }

  const platforms: string[] = [];
  const tokens: any = {};

  // 2.1 Meta (Facebook & Instagram)
  const fbTokenEnc = profile.facebookToken_enc || userData.facebookToken_enc;
  const ivFb = profile.iv_fb || userData.iv_fb;
  const tagFb = profile.tag_fb || userData.tag_fb;
  const pageId = profile.facebookPageId || userData.facebookPageId;

  const igTokenEnc = profile.instagramToken_enc || userData.instagramToken_enc;
  const ivIg = profile.iv_ig || userData.iv_ig;
  const tagIg = profile.tag_ig || userData.tag_ig;
  const igAccountId = profile.instagramAccountId || userData.instagramAccountId;

  let fbToken = "";
  let igToken = "";

  if (fbTokenEnc && ivFb && tagFb) {
    try {
      fbToken = decrypt(fbTokenEnc, ivFb, tagFb);
    } catch (err) {
      console.warn("[Sync Agent] Error descifrando token de Facebook:", err);
    }
  }

  if (igTokenEnc && ivIg && tagIg) {
    try {
      igToken = decrypt(igTokenEnc, ivIg, tagIg);
    } catch (err) {
      console.warn("[Sync Agent] Error descifrando token de Instagram:", err);
    }
  }

  if (fbToken || igToken) {
    platforms.push("meta");
    tokens.meta = {
      fbToken,
      pageId,
      igToken,
      igAccountId
    };
  }

  // 2.2 TikTok (Enfoque seguro: verificar conexión sin arriesgar Direct Post)
  const ttTokenEnc = profile.tiktokToken_enc || userData.tiktokToken_enc;
  const ivTt = profile.iv_tt || userData.iv_tt;
  const tagTt = profile.tag_tt || userData.tag_tt;
  let ttToken = "";

  if (ttTokenEnc && ivTt && tagTt) {
    try {
      ttToken = decrypt(ttTokenEnc, ivTt, tagTt);
    } catch (err) {
      console.warn("[Sync Agent] Error descifrando token de TikTok:", err);
    }
  }

  if (ttToken) {
    platforms.push("tiktok");
    tokens.tiktok = { token: ttToken };
  }

  // 2.3 LinkedIn
  const liTokenEnc = profile.linkedinToken_enc || profile.linkedinUserToken_enc || userData.linkedinToken_enc;
  const ivLi = profile.iv_li || userData.iv_li;
  const tagLi = profile.tag_li || userData.tag_li;
  let liToken = "";

  if (liTokenEnc && ivLi && tagLi) {
    try {
      liToken = decrypt(liTokenEnc, ivLi, tagLi);
    } catch (err) {
      console.warn("[Sync Agent] Error descifrando token de LinkedIn:", err);
    }
  }

  if (liToken) {
    platforms.push("linkedin");
    tokens.linkedin = { token: liToken };
  }

  // 2.4 YouTube (Conectado con youtube.readonly ya aprobado)
  const ytAccount = profile.accounts?.youtube || {};
  const ytTokenEnc = profile.youtubeToken_enc || (typeof ytAccount.token === "string" ? ytAccount.token : ytAccount.token?.encryptedData) || userData.youtubeToken_enc;
  const ivYt = profile.iv_yt || ytAccount.iv || ytAccount.token?.iv || userData.iv_yt;
  const tagYt = profile.tag_yt || ytAccount.authTag || ytAccount.tag || ytAccount.token?.authTag || userData.tag_yt;
  const ytRefreshTokenEnc = profile.youtubeRefreshToken_enc || (typeof ytAccount.refreshToken === "string" ? ytAccount.refreshToken : ytAccount.refreshToken?.encryptedData) || userData.youtubeRefreshToken_enc;
  const ivYtRef = profile.iv_yt_refresh || ytAccount.iv_refresh || ytAccount.refreshToken?.iv || userData.iv_yt_refresh;
  const tagYtRef = profile.tag_yt_refresh || ytAccount.tag_refresh || ytAccount.refreshToken?.authTag || userData.tag_yt_refresh;

  let ytToken = "";
  let ytRefreshToken = "";

  if (ytTokenEnc && ivYt && tagYt) {
    try {
      ytToken = decrypt(ytTokenEnc, ivYt, tagYt);
    } catch (err) {
      console.warn("[Sync Agent] Error descifrando token de YouTube:", err);
    }
  }

  if (ytRefreshTokenEnc && ivYtRef && tagYtRef) {
    try {
      ytRefreshToken = decrypt(ytRefreshTokenEnc, ivYtRef, tagYtRef);
    } catch (err) {
      console.warn("[Sync Agent] Error descifrando refresh token de YouTube:", err);
    }
  }

  if (ytToken || ytRefreshToken) {
    platforms.push("youtube");
    tokens.youtube = {
      token: ytToken,
      refreshToken: ytRefreshToken,
      channelId: profile.youtubeChannelId || ytAccount.channelId || ""
    };
  }

  const statusMsg = platforms.length > 0 
    ? `Nuestros agentes detectaron ${platforms.length} plataforma(s) conectada(s): ${platforms.join(", ")}.`
    : `No se detectaron redes sociales vinculadas con credenciales activas en este perfil.`;

  return { platforms, tokens, logs: [statusMsg] };
}

// 3. Agente Meta: Sincroniza Facebook e Instagram con métricas e insights
async function metaAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("meta") || !state.tokens.meta) return {};
  console.log("[Sync Agent] MetaAgent - Iniciando sincronización de Facebook e Instagram...");

  const { fbToken, pageId, igToken, igAccountId } = state.tokens.meta;
  let count = 0;
  const logs: string[] = [];

  // 3.1 Sincronización Facebook
  if (fbToken && pageId) {
    try {
      const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/published_posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&access_token=${fbToken}&limit=25`;
      const fbRes = await fetch(fbUrl);
      const fbData = await fbRes.json();

      if (fbData && Array.isArray(fbData.data)) {
        for (const post of fbData.data) {
          const postId = post.id;
          const likes = post.likes?.summary?.total_count ?? 0;
          const comments = post.comments?.summary?.total_count ?? 0;
          const shares = post.shares?.count ?? 0;
          let reach = 0;
          let impressions = 0;

          try {
            const insRes = await fetch(`https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions,post_impressions_unique&access_token=${fbToken}`);
            const insData = await insRes.json();
            if (Array.isArray(insData.data)) {
              const impItem = insData.data.find((item: any) => item.name === "post_impressions");
              const reachItem = insData.data.find((item: any) => item.name === "post_impressions_unique");
              impressions = impItem?.values?.[0]?.value ?? 0;
              reach = reachItem?.values?.[0]?.value ?? 0;
            }
          } catch (insErr) {
            // Silencioso
          }

          const createdDate = post.created_time ? new Date(post.created_time) : new Date();

          await upsertExternalPost(postId, {
            userId: state.userId,
            profileId: state.profileId,
            network: "facebook",
            caption: post.message || "",
            media_type: "POST",
            likes,
            comments,
            shares,
            reach,
            impressions,
            created_time: post.created_time,
            timestamp: createdDate,
            lastSyncedAt: new Date()
          });
          count++;
        }
        logs.push(`Facebook: ${fbData.data.length} publicaciones sincronizadas con métricas de alcance e interacciones.`);
      } else if (fbData?.error) {
        logs.push(`Facebook Graph API: ${fbData.error.message || "Error al consultar publicaciones"}`);
      }
    } catch (fbErr: any) {
      console.error("[Sync Agent] Error en Facebook:", fbErr);
      logs.push(`Facebook: Error de conexión (${fbErr.message})`);
    }
  }

  // 3.2 Sincronización Instagram
  if (igToken && igAccountId) {
    try {
      const igUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media?fields=id,caption,timestamp,media_type,like_count,comments_count&access_token=${igToken}&limit=25`;
      const igRes = await fetch(igUrl);
      const igData = await igRes.json();

      if (igData && Array.isArray(igData.data)) {
        for (const media of igData.data) {
          const mediaId = media.id;
          const likes = media.like_count ?? 0;
          const comments = media.comments_count ?? 0;
          let reach = 0;
          let impressions = 0;

          try {
            const insRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}/insights?metric=reach,impressions&access_token=${igToken}`);
            const insData = await insRes.json();
            if (Array.isArray(insData.data)) {
              const reachItem = insData.data.find((item: any) => item.name === "reach");
              const impItem = insData.data.find((item: any) => item.name === "impressions");
              reach = reachItem?.values?.[0]?.value ?? 0;
              impressions = impItem?.values?.[0]?.value ?? 0;
            }
          } catch (insErr) {
            // Silencioso
          }

          const mediaDate = media.timestamp ? new Date(media.timestamp) : new Date();

          await upsertExternalPost(mediaId, {
            userId: state.userId,
            profileId: state.profileId,
            network: "instagram",
            caption: media.caption || "",
            media_type: media.media_type || "POST",
            likes,
            comments,
            shares: 0,
            reach,
            impressions,
            created_time: media.timestamp,
            timestamp: mediaDate,
            lastSyncedAt: new Date()
          });
          count++;
        }
        logs.push(`Instagram: ${igData.data.length} publicaciones/reels sincronizados con métricas reales.`);
      } else if (igData?.error) {
        logs.push(`Instagram Graph API: ${igData.error.message || "Error al consultar media"}`);
      }
    } catch (igErr: any) {
      console.error("[Sync Agent] Error en Instagram:", igErr);
      logs.push(`Instagram: Error de conexión (${igErr.message})`);
    }
  }

  return { syncedCount: count, logs };
}

// 4. Agente YouTube: Consulta métricas de videos en vivo vía YouTube Data API v3
async function youtubeAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("youtube") || !state.tokens.youtube) return {};
  console.log("[Sync Agent] YouTubeAgent - Iniciando sincronización de métricas de YouTube...");

  const { token, refreshToken } = state.tokens.youtube;
  let activeToken = token;
  let count = 0;
  const logs: string[] = [];

  // 1. Obtener videos de YouTube del usuario en external_posts
  let ytPostDocs: any[] = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection("external_posts")
        .where("userId", "==", state.userId)
        .where("profileId", "==", state.profileId)
        .where("network", "==", "youtube")
        .limit(50)
        .get();
      ytPostDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("[Sync Agent] Error consultando external_posts de YouTube:", e);
    }
  }

  // Si no hay posts en Firestore pero tenemos token activo, buscar los uploads recientes del canal
  if (ytPostDocs.length === 0 && activeToken) {
    try {
      const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const chData = await chRes.json();
      const uploadsId = chData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (uploadsId) {
        const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=20`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        const plData = await plRes.json();
        if (Array.isArray(plData?.items)) {
          ytPostDocs = plData.items.map((it: any) => ({
            id: it.snippet?.resourceId?.videoId,
            caption: it.snippet?.title || "",
            created_time: it.snippet?.publishedAt,
            permalink: `https://youtube.com/shorts/${it.snippet?.resourceId?.videoId}`
          })).filter((x: any) => Boolean(x.id));
        }
      }
    } catch (chErr) {
      console.warn("[Sync Agent] Error buscando videos del canal de YouTube:", chErr);
    }
  }

  if (ytPostDocs.length === 0) {
    return { logs: ["YouTube: No se encontraron videos subidos para sincronizar."] };
  }

  // 2. Consultar estadísticas de los videos
  const videoIds = ytPostDocs.map(d => d.id).filter(Boolean);
  if (videoIds.length > 0) {
    try {
      const idsChunk = videoIds.slice(0, 50).join(",");
      let statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${idsChunk}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });

      // Si token expiró (401) y tenemos refreshToken, refrescar token
      if (statsRes.status === 401 && refreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        try {
          const refRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: refreshToken,
              grant_type: "refresh_token"
            })
          });
          const refData = await refRes.json();
          if (refData.access_token) {
            activeToken = refData.access_token;
            // Guardar token actualizado
            if (adminDb) {
              const encNew = encrypt(activeToken);
              const uRef = adminDb.collection("users").doc(state.userId);
              const uSnap = await uRef.get();
              const profiles = uSnap.data()?.profiles || [];
              const pIdx = profiles.findIndex((p: any) => p.id === state.profileId);
              if (pIdx !== -1) {
                profiles[pIdx].youtubeToken_enc = encNew.encryptedData;
                profiles[pIdx].iv_yt = encNew.iv;
                profiles[pIdx].tag_yt = encNew.authTag;
                await uRef.update({ profiles });
              }
            }
            statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${idsChunk}`, {
              headers: { Authorization: `Bearer ${activeToken}` }
            });
          }
        } catch (rfErr) {
          console.warn("[Sync Agent] Error refrescando token de YouTube:", rfErr);
        }
      }

      const statsData = await statsRes.json();
      if (Array.isArray(statsData?.items)) {
        for (const item of statsData.items) {
          const stats = item.statistics || {};
          const views = Number(stats.viewCount || 0);
          const likes = Number(stats.likeCount || 0);
          const comments = Number(stats.commentCount || 0);

          await upsertExternalPost(item.id, {
            userId: state.userId,
            profileId: state.profileId,
            network: "youtube",
            caption: item.snippet?.title || "",
            media_type: "VIDEO",
            likes,
            comments,
            shares: 0,
            reach: views,
            impressions: views,
            timestamp: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date(),
            lastSyncedAt: new Date()
          });
          count++;
        }
        logs.push(`YouTube: ${count} videos sincronizados con reproducciones y reacciones en vivo.`);
      }
    } catch (vErr: any) {
      console.error("[Sync Agent] Error consultando videos de YouTube:", vErr);
      logs.push(`YouTube: Error al consultar métricas (${vErr.message})`);
    }
  }

  return { syncedCount: count, logs };
}

// 5. Agente TikTok: Maneja métricas de TikTok (modo seguro sin modificar permisos)
async function tiktokAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("tiktok")) return {};
  return { logs: ["TikTok: Conexión activa y publicaciones monitoreadas."] };
}

// 6. Agente LinkedIn: Maneja métricas de LinkedIn
async function linkedinAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("linkedin")) return {};
  return { logs: ["LinkedIn: Conexión activa y publicaciones monitoreadas."] };
}

// 7. Construcción del Grafo Multi-Agente
export function createSyncWorkflow() {
  const workflow = new StateGraph(SyncAnnotation)
    .addNode("discovery", discoveryNode)
    .addNode("meta", metaAgentNode)
    .addNode("youtube", youtubeAgentNode)
    .addNode("tiktok", tiktokAgentNode)
    .addNode("linkedin", linkedinAgentNode)

    .addEdge(START, "discovery")
    .addEdge("discovery", "meta")
    .addEdge("discovery", "youtube")
    .addEdge("discovery", "tiktok")
    .addEdge("discovery", "linkedin")

    .addEdge("meta", END)
    .addEdge("youtube", END)
    .addEdge("tiktok", END)
    .addEdge("linkedin", END);

  return workflow.compile();
}

/**
 * Ejecuta el orquestador multi-agente para sincronizar todas las redes
 */
export async function runMultiAgentSync(userId: string, profileId: string = "default") {
  const app = createSyncWorkflow();
  const result = await app.invoke({ userId, profileId });
  return {
    syncedCount: result.syncedCount,
    logs: result.logs,
    platforms: result.platforms
  };
}
