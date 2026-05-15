import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { decrypt } from "./encryption";

// 1. Estado del Grafo de Sincronización
export const SyncAnnotation = Annotation.Root({
  userId: Annotation<string>({ reducer: (a, b) => b ?? a }),
  profileId: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "default" }),
  platforms: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  syncedCount: Annotation<number>({ reducer: (a, b) => a + (b ?? 0), default: () => 0 }),
  logs: Annotation<string[]>({ reducer: (a, b) => [...a, ...(b ?? [])], default: () => [] }),
  tokens: Annotation<any>({ reducer: (a, b) => ({...a, ...b}), default: () => ({}) }),
});

export type SyncState = typeof SyncAnnotation.State;

// 2. Nodo de Descubrimiento: Identifica qué redes están activas y obtiene tokens
async function discoveryNode(state: SyncState): Promise<Partial<SyncState>> {
  console.log(`[Sync Agent] Discovery - Iniciando para usuario ${state.userId}`);
  const userSnap = await getDoc(doc(db, "users", state.userId));
  if (!userSnap.exists()) throw new Error("Usuario no encontrado");

  const userData = userSnap.data();
  let profile = userData;
  if (state.profileId !== 'default' && Array.isArray(userData.profiles)) {
    profile = userData.profiles.find((p: any) => p.id === state.profileId) || userData;
  }

  const platforms = [];
  const tokens: any = {};

  // Meta (FB/IG)
  if (profile.facebookToken_enc || userData.facebookToken_enc) {
    platforms.push("meta");
    tokens.meta = {
      fbToken: decrypt(profile.facebookToken_enc || userData.facebookToken_enc, profile.iv_fb || userData.iv_fb, profile.tag_fb || userData.tag_fb),
      pageId: profile.facebookPageId || userData.facebookPageId,
      igToken: decrypt(profile.instagramToken_enc || userData.instagramToken_enc, profile.iv_ig || userData.iv_ig, profile.tag_ig || userData.tag_ig),
      igAccountId: profile.instagramAccountId || userData.instagramAccountId
    };
  }

  // TikTok
  if (profile.tiktokToken_enc || userData.tiktokToken_enc) {
    platforms.push("tiktok");
    tokens.tiktok = {
      token: decrypt(profile.tiktokToken_enc || userData.tiktokToken_enc, profile.iv_tt || userData.iv_tt, profile.tag_tt || userData.tag_tt)
    };
  }

  // LinkedIn
  if (profile.linkedinToken_enc || profile.linkedinUserToken_enc || userData.linkedinToken_enc) {
    platforms.push("linkedin");
    tokens.linkedin = {
      token: decrypt(profile.linkedinToken_enc || profile.linkedinUserToken_enc || userData.linkedinToken_enc, profile.iv_li || userData.iv_li, profile.tag_li || userData.tag_li)
    };
  }

  return { platforms, tokens, logs: [`Descubiertas ${platforms.length} plataformas activas.`] };
}

// 3. Agente Meta: Maneja Facebook e Instagram
async function metaAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("meta") || !state.tokens.meta) return {};
  console.log("[Sync Agent] MetaAgent - Sincronizando FB e IG...");
  
  const { fbToken, pageId, igToken, igAccountId } = state.tokens.meta;
  let count = 0;

  // Lógica de sincronización FB (resumida del route original)
  if (fbToken && pageId) {
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/published_posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&access_token=${fbToken}&limit=10`);
        const data = await res.json();
        if (data.data) {
            for (const post of data.data) {
                await setDoc(doc(db, "external_posts", post.id), {
                    userId: state.userId,
                    profileId: state.profileId,
                    network: 'facebook',
                    caption: post.message || '',
                    likes: post.likes?.summary?.total_count || 0,
                    comments: post.comments?.summary?.total_count || 0,
                    timestamp: new Date(post.created_time),
                    lastSyncedAt: new Date()
                }, { merge: true });
                count++;
            }
        }
    } catch (e) { console.error("Error FB Agent:", e); }
  }

  // Lógica de sincronización IG
  if (igToken && igAccountId) {
      try {
          const res = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?fields=id,caption,timestamp,like_count,comments_count&access_token=${igToken}&limit=10`);
          const data = await res.json();
          if (data.data) {
              for (const post of data.data) {
                  await setDoc(doc(db, "external_posts", post.id), {
                      userId: state.userId,
                      profileId: state.profileId,
                      network: 'instagram',
                      caption: post.caption || '',
                      likes: post.like_count || 0,
                      comments: post.comments_count || 0,
                      timestamp: new Date(post.timestamp),
                      lastSyncedAt: new Date()
                  }, { merge: true });
                  count++;
              }
          }
      } catch (e) { console.error("Error IG Agent:", e); }
  }

  return { syncedCount: count, logs: [`MetaAgent sincronizó ${count} posts.`] };
}

// 4. Agente TikTok: Maneja métricas de TikTok
async function tiktokAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("tiktok")) return {};
  console.log("[Sync Agent] TikTokAgent - Obteniendo métricas de TikTok...");
  
  // Placeholder: Aquí iría la llamada a https://open.tiktokapis.com/v2/video/list/
  // Por ahora simulamos éxito si el token existe
  return { logs: ["TikTokAgent: Pendiente implementación de API v2 metrics."] };
}

// 5. Agente LinkedIn: Maneja métricas de LinkedIn
async function linkedinAgentNode(state: SyncState): Promise<Partial<SyncState>> {
  if (!state.platforms.includes("linkedin")) return {};
  console.log("[Sync Agent] LinkedInAgent - Obteniendo métricas de LinkedIn...");
  
  // Placeholder: Aquí iría la llamada a /organizationalEntityShareStatistics
  return { logs: ["LinkedInAgent: Pendiente implementación de API Share Statistics."] };
}

// 6. Construcción del Grafo Multi-Agente
export function createSyncWorkflow() {
  const workflow = new StateGraph(SyncAnnotation)
    .addNode("discovery", discoveryNode)
    .addNode("meta", metaAgentNode)
    .addNode("tiktok", tiktokAgentNode)
    .addNode("linkedin", linkedinAgentNode)
    
    .addEdge(START, "discovery")
    // Ejecución en paralelo tras el discovery
    .addEdge("discovery", "meta")
    .addEdge("discovery", "tiktok")
    .addEdge("discovery", "linkedin")
    
    // Todos convergen al final
    .addEdge("meta", END)
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
