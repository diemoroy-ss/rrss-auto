import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateNicheRadarAnalysis } from '../../../../lib/niche-radar';
import { getQuotaUsageAdmin, getPlanLimitAdmin, getAiPlanLimitAdmin } from '../../../../lib/quota-admin';
import { enqueuePostTask } from '../../../../lib/gcp-tasks';
import { getFreeModel, generateFreeText } from '../../../../lib/gemini-free';
import { getNextScheduleSlotServer } from '../../../../lib/schedule-continuity-server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface AccountOption {
  userId: string;
  profileId: string;
  businessName: string;
  rubro: string;
  email: string;
  userPlan: string;
  userDoc: any;
  profileDoc: any;
}

const NETWORK_META: Record<string, { name: string; emoji: string }> = {
  instagram: { name: 'Instagram', emoji: '📸' },
  facebook: { name: 'Facebook', emoji: '🔵' },
  linkedin: { name: 'LinkedIn', emoji: '💼' },
  tiktok: { name: 'TikTok', emoji: '🎵' },
  youtube: { name: 'YouTube', emoji: '▶️' },
  x: { name: '𝕏', emoji: '𝕏' },
};

function formatNetworks(networks: string[]): string {
  if (!networks || networks.length === 0) return 'Ninguna red';
  return networks
    .map((net) => {
      const meta = NETWORK_META[net.toLowerCase()];
      return meta ? `${meta.emoji} ${meta.name}` : net;
    })
    .join(', ');
}

function getConnectedNetworks(profileDoc: any, userDoc: any): string[] {
  const p = profileDoc || {};
  const u = userDoc || {};
  const isDefault = !p.id || p.id === 'default';

  const networks: string[] = [];

  const fbOK = !!p.facebookToken_enc || (isDefault && !!u.facebookToken_enc);
  const igOK = !!p.instagramToken_enc || (isDefault && !!u.instagramToken_enc);
  const ttOK = !!p.tiktokToken_enc || (isDefault && !!u.tiktokToken_enc) || !!p.accounts?.tiktok;
  const liOK = !!p.linkedinUserToken_enc || !!p.linkedinToken_enc || (isDefault && (!!u.linkedinUserToken_enc || !!u.linkedinToken_enc)) || !!p.accounts?.linkedin;
  const ytOK = !!p.youtubeToken_enc || (isDefault && !!u.youtubeToken_enc) || !!p.accounts?.youtube;
  const xOK = !!p.xToken_enc || (isDefault && !!u.xToken_enc) || !!p.accounts?.x;

  if (igOK) networks.push('instagram');
  if (fbOK) networks.push('facebook');
  if (liOK) networks.push('linkedin');
  if (ttOK) networks.push('tiktok');
  if (ytOK) networks.push('youtube');
  if (xOK) networks.push('x');

  return networks.length > 0 ? networks : ['instagram', 'facebook'];
}

function extractNetworksFromPhrase(phrase: string): string[] {
  const t = phrase.toLowerCase();
  const detected: string[] = [];

  if (/\b(instagram|ig|insta)\b/.test(t)) detected.push('instagram');
  if (/\b(facebook|fb|face)\b/.test(t)) detected.push('facebook');
  if (/\b(linkedin|li|linkdin)\b/.test(t)) detected.push('linkedin');
  if (/\b(tiktok|tt|tik\s*tok)\b/.test(t)) detected.push('tiktok');
  if (/\b(youtube|yt|you\s*tube)\b/.test(t)) detected.push('youtube');
  if (/\b(x|twitter)\b/.test(t)) detected.push('x');

  return Array.from(new Set(detected));
}

/**
 * Endpoint central para procesar acciones de WhatsApp provenientes de n8n / Evolution API.
 * Identifica si el teléfono pertenece a una o múltiples cuentas/perfiles.
 * Si tiene más de una cuenta, permite alternar y siempre recuerda el comando para cambiar.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, remoteJid, action = '0', text = '', pushName = 'Cliente' } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Falta el número de teléfono' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Base de datos no inicializada' }, { status: 500 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanInput = (text || '').trim().toLowerCase();

    // 1. Buscar TODAS las marcas/perfiles que tengan este teléfono en "Datos & Contacto" (p.phone)
    const matchedAccounts: AccountOption[] = [];
    const usersSnap = await adminDb.collection('users').get();

    // Primer barrido: buscar coincidencias directas en los Datos de Contacto de la Marca (profile.phone)
    for (const doc of usersSnap.docs) {
      const uData = doc.data();
      const profiles = Array.isArray(uData.profiles) ? uData.profiles : [];

      profiles.forEach((p: any) => {
        const pPhone = (p.phone || p.whatsappPhone || '').replace(/\D/g, '');
        const isProfilePhoneMatch =
          pPhone && (pPhone === cleanPhone || cleanPhone.endsWith(pPhone) || pPhone.endsWith(cleanPhone));

        if (isProfilePhoneMatch) {
          matchedAccounts.push({
            userId: doc.id,
            profileId: p.id || 'default',
            businessName: p.name || uData.displayName || 'Mi Negocio',
            rubro: p.rubro || uData.rubro || 'General',
            email: uData.email || '',
            userPlan: uData.plan || 'free',
            userDoc: uData,
            profileDoc: p,
          });
        }
      });
    }

    // Segundo barrido (Fallback): si ninguna marca tiene el teléfono en Datos & Contacto, buscar en el usuario
    if (matchedAccounts.length === 0) {
      for (const doc of usersSnap.docs) {
        const uData = doc.data();
        const userPhone = (uData.phone || uData.whatsappPhone || '').replace(/\D/g, '');
        const isUserPhoneMatch =
          userPhone && (userPhone === cleanPhone || cleanPhone.endsWith(userPhone) || userPhone.endsWith(cleanPhone));

        if (isUserPhoneMatch) {
          const profiles = Array.isArray(uData.profiles) ? uData.profiles : [];
          if (profiles.length > 0) {
            profiles.forEach((p: any) => {
              matchedAccounts.push({
                userId: doc.id,
                profileId: p.id || 'default',
                businessName: p.name || uData.displayName || 'Mi Negocio',
                rubro: p.rubro || uData.rubro || 'General',
                email: uData.email || '',
                userPlan: uData.plan || 'free',
                userDoc: uData,
                profileDoc: p,
              });
            });
          } else {
            matchedAccounts.push({
              userId: doc.id,
              profileId: 'default',
              businessName: uData.displayName || 'Mi Negocio',
              rubro: uData.rubro || 'General',
              email: uData.email || '',
              userPlan: uData.plan || 'free',
              userDoc: uData,
              profileDoc: null,
            });
          }
        }
      }
    }

    // Si el usuario no tiene ninguna cuenta asociada
    if (matchedAccounts.length === 0) {
      const notFoundMessage =
        `¡Hola ${pushName}! 👋\n\n` +
        `No encontramos una cuenta de Santisoft asociada a este número de teléfono (*${phone}*).\n\n` +
        `Para vincular tu cuenta:\n` +
        `1. Ingresa a tu panel en https://rrss.santisoft.cl\n` +
        `2. Ve a *Configuración > Datos & Contacto*\n` +
        `3. Añade este número en tu teléfono de contacto y guarda los cambios.\n\n` +
        `🛡️ _Recuerda guardar este número (+56 9 6590 9543) en tu agenda como *Santisoft Agentes* para que WhatsApp reconozca la cuenta como segura._\n\n` +
        `Una vez guardado, vuelve a escribirme para activar tu asistente. 🚀`;

      return NextResponse.json({
        success: true,
        replyText: notFoundMessage,
        isRegistered: false,
      });
    }

    const hasMultipleAccounts = matchedAccounts.length > 1;

    // 2. Obtener sesión activa de WhatsApp (para recordar qué cuenta está seleccionada)
    const chatDocRef = adminDb.collection('whatsapp_chats').doc(cleanPhone);
    const chatDocSnap = await chatDocRef.get();
    const chatData = chatDocSnap.exists ? chatDocSnap.data() : {};
    let activeIndex = chatData?.activeAccountIndex ?? 0;

    // Si el índice guardado ya no es válido, reiniciar al primero
    if (activeIndex >= matchedAccounts.length || activeIndex < 0) {
      activeIndex = 0;
    }

    // ----------------------------------------------------
    // MANEJO DE CAMBIO DE CUENTA EXPLÍCITO
    // ----------------------------------------------------
    const wantsToChangeAccount =
      action === '8' ||
      cleanInput === '8' ||
      cleanInput.includes('cambiar cuenta') ||
      cleanInput.includes('otra cuenta') ||
      cleanInput.includes('cambiar negocio') ||
      cleanInput === 'cuentas' ||
      cleanInput === 'cambiar';

    if (wantsToChangeAccount && hasMultipleAccounts) {
      let accountsList = '';
      matchedAccounts.forEach((acc, idx) => {
        const isCurrent = idx === activeIndex ? ' *(Actual)*' : '';
        accountsList += `*${idx + 1}.* ${acc.businessName} (${acc.rubro}) - _${acc.email}_${isCurrent}\n`;
      });

      const replyText =
        `🏢 *Cuentas disponibles asociadas a tu teléfono:*\n\n` +
        accountsList +
        `\n👉 Responde con *C1*, *C2*, *C3*... para seleccionar la cuenta que deseas gestionar.\n` +
        `_Ejemplo: Escribe *C1* para elegir la primera opción._`;

      return NextResponse.json({
        success: true,
        replyText,
        hasMultipleAccounts,
      });
    }

    // Si el usuario respondió "C1", "C2", etc., para seleccionar cuenta
    const matchAccountSelection = cleanInput.match(/^c([1-9]\d*)$/);
    if (matchAccountSelection && hasMultipleAccounts) {
      const selectedIndex = parseInt(matchAccountSelection[1], 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < matchedAccounts.length) {
        activeIndex = selectedIndex;
        await chatDocRef.set({ activeAccountIndex: activeIndex }, { merge: true });

        const selectedAcc = matchedAccounts[activeIndex];
        const replyText =
          `✅ *Cuenta activa cambiada con éxito.*\n\n` +
          `Ahora estás gestionando: *${selectedAcc.businessName}* (${selectedAcc.rubro})\n\n` +
          `¿Qué deseas hacer ahora?\n` +
          `1️⃣ Ver próximos posts\n` +
          `2️⃣ Ver posts publicados\n` +
          `3️⃣ Radar de nicho\n` +
          `4️⃣ Crear post puntual (AHORA o en cola)\n` +
          `5️⃣ Planificar estrategia (2 semanas) 🗓️\n` +
          `6️⃣ Aprobar pendientes\n` +
          `7️⃣ Ver cuota y estadísticas\n\n` +
          `_💡 Recuerda: Puedes escribir *8* o *CAMBIAR* en cualquier momento para volver a otra cuenta._`;

        return NextResponse.json({
          success: true,
          replyText,
          hasMultipleAccounts,
          activeAccount: selectedAcc.businessName,
        });
      }
    }

    // Cuenta activa para procesar la acción
    const currentAccount = matchedAccounts[activeIndex];
    const { userId, profileId, businessName, rubro, userPlan, email } = currentAccount;

    // Asegurar que activeAccountIndex esté guardado en sesión
    if (chatData?.activeAccountIndex !== activeIndex) {
      await chatDocRef.set({ activeAccountIndex: activeIndex }, { merge: true });
    }

    // Nota que se agrega al final si tiene varias cuentas conectadas
    const multiAccountFooter = hasMultipleAccounts
      ? `\n\n━━━━━━━━━━━━━━━\n🔄 _Gestionando: *${businessName}*. Tienes ${matchedAccounts.length} cuentas vinculadas. Escribe *8* o *CAMBIAR* para alternar._`
      : '';

    let replyText = '';

    // Detección inteligente de acción si viene como texto libre
    let effectiveAction = action;
    if (action === '0' || !action) {
      if (/^6\b|aprobar|publicar ya|publicar ahora|ahora|cola/i.test(cleanInput)) {
        effectiveAction = '6';
      } else if (
        /^(solo\s+|sin\s+|quitar\s+|sacar\s+|agregar\s+|sumar\s+|incluir\s+|redes\b|cambiar\s+redes)/i.test(cleanInput) ||
        /^(solo\s+(instagram|ig|facebook|fb|linkedin|tiktok|youtube|x))/i.test(cleanInput) ||
        cleanInput === 'redes'
      ) {
        effectiveAction = 'redes';
      } else if (/^5\b|estrategia|semanas?|planificar|planificacion|calendario/i.test(cleanInput)) {
        effectiveAction = '5';
      } else if (/^4\b|crear post|nueva idea|crear/i.test(cleanInput)) {
        effectiveAction = '4';
      } else if (/^1\b|proximos|agendados/i.test(cleanInput)) {
        effectiveAction = '1';
      } else if (/^2\b|publicados|historial/i.test(cleanInput)) {
        effectiveAction = '2';
      } else if (/^3\b|radar|tendencias/i.test(cleanInput)) {
        effectiveAction = '3';
      } else if (/^7\b|cuota|plan|estadisticas/i.test(cleanInput)) {
        effectiveAction = '7';
      } else if (/^8\b|cambiar cuenta|otra cuenta|cambiar negocio|cuentas|cambiar/i.test(cleanInput)) {
        effectiveAction = '8';
      }
    }

    // 3. Ejecutar la acción
    switch (effectiveAction) {
      // ----------------------------------------------------
      // OPCIÓN 1: Ver próximos posts agendados
      // ----------------------------------------------------
      case '1': {
        const [confirmedSnap, pendingSnap] = await Promise.all([
          adminDb
            .collection('social_posts')
            .where('userId', '==', userId)
            .where('status', '==', 'confirmed')
            .get(),
          adminDb
            .collection('social_posts')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .get(),
        ]);

        const allDocs = [...confirmedSnap.docs, ...pendingSnap.docs];
        const nowThreshold = Date.now() - 3 * 60 * 60 * 1000; // Considera posts de hoy y futuros

        const upcomingPosts = allDocs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p) => {
            const matchesProfile = !p.profileId || p.profileId === profileId;
            const schedTime = p.scheduledFor?.toDate ? p.scheduledFor.toDate().getTime() : new Date(p.scheduledFor || 0).getTime();
            return matchesProfile && schedTime >= nowThreshold;
          })
          .sort((a, b) => {
            const timeA = a.scheduledFor?.toDate ? a.scheduledFor.toDate().getTime() : new Date(a.scheduledFor || 0).getTime();
            const timeB = b.scheduledFor?.toDate ? b.scheduledFor.toDate().getTime() : new Date(b.scheduledFor || 0).getTime();
            return timeA - timeB;
          })
          .slice(0, 5);

        if (upcomingPosts.length === 0) {
          replyText =
            `📅 *Próximos Posts de ${businessName}:*\n\n` +
            `No tienes publicaciones agendadas actualmente.\n\n` +
            `👉 *Escribe 4* para que nuestros agentes creen una nueva idea o *5* para planificar 2 semanas.` +
            multiAccountFooter;
        } else {
          let list = '';
          upcomingPosts.forEach((p, idx) => {
            const dateObj = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
            const dateFormatted = format(dateObj, "EEEE d 'de' MMMM, HH:mm", { locale: es });
            const typeEmoji = (p.type || '').toLowerCase().includes('reel') ? '🎬' : '🖼️';
            const statusTag = p.status === 'confirmed' ? '⏳ Agendado' : '⏸️ Borrador pendiente';
            const styleLine = p.visualStyle ? `🎨 *Estilo visual:* ${p.visualStyle}\n` : '';
            const networksLine = p.networks && p.networks.length > 0 ? `📱 *Redes:* ${formatNetworks(p.networks)}\n` : '';
            list += `*${idx + 1}.* ${typeEmoji} *${p.type || 'Post'}* (${statusTag})\n` +
                    `📅 ${dateFormatted}\n` +
                    styleLine +
                    networksLine +
                    `📝 "${(p.idea || p.copy || p.postText || '').slice(0, 100)}..."\n\n`;
          });

          replyText =
            `📅 *Próximas publicaciones para ${businessName}:*\n\n` +
            list +
            `_Escribe *6* si deseas confirmar borradores pendientes, o *0* para volver al menú._` +
            multiAccountFooter;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 2: Ver posts publicados
      // ----------------------------------------------------
      case '2': {
        const postsSnap = await adminDb
          .collection('social_posts')
          .where('userId', '==', userId)
          .where('status', '==', 'published')
          .get();

        const publishedPosts = postsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p) => !p.profileId || p.profileId === profileId)
          .sort((a, b) => {
            const timeA = a.publishedAt?.toDate ? a.publishedAt.toDate().getTime() : (a.scheduledFor?.toDate ? a.scheduledFor.toDate().getTime() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0));
            const timeB = b.publishedAt?.toDate ? b.publishedAt.toDate().getTime() : (b.scheduledFor?.toDate ? b.scheduledFor.toDate().getTime() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0));
            return timeB - timeA;
          })
          .slice(0, 5);

        if (publishedPosts.length === 0) {
          replyText =
            `📭 *Historial de ${businessName}:*\n\n` +
            `Aún no hay publicaciones enviadas automáticamente desde Santisoft.\n\n` +
            `_Escribe *1* para revisar lo que está agendado o *0* para el menú._` +
            multiAccountFooter;
        } else {
          let list = '';
          publishedPosts.forEach((p, idx) => {
            const dateObj = p.publishedAt?.toDate ? p.publishedAt.toDate() : (p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date());
            const dateFormatted = format(dateObj, "d 'de' MMM, HH:mm", { locale: es });
            const styleLine = p.visualStyle ? `🎨 *Estilo visual:* ${p.visualStyle}\n` : '';
            const networksLine = p.networks && p.networks.length > 0 ? `📱 *Redes:* ${formatNetworks(p.networks)}\n` : '';
            list += `*${idx + 1}.* ✅ *Publicado el ${dateFormatted}*\n` +
                    styleLine +
                    networksLine +
                    `📝 "${(p.idea || p.copy || p.postText || '').slice(0, 85)}..."\n\n`;
          });

          replyText =
            `✅ *Últimas publicaciones de ${businessName}:*\n\n` +
            list +
            `_Tus redes se están actualizando con regularidad. Escribe *0* para volver al menú._` +
            multiAccountFooter;
        }
        break;
      }

      // ----------------------------------------------------
      // ----------------------------------------------------
      // OPCIÓN 3: Radar de Nicho y Tendencias
      // ----------------------------------------------------
      case '3': {
        const radarAnalysis = await generateNicheRadarAnalysis({
          businessName,
          niche: rubro,
          targetAudience: 'Público objetivo local',
          customKeywords: '',
        });

        const topTrends = (radarAnalysis.trends || []).slice(0, 3);
        const topIdeas = (radarAnalysis.ideas || []).slice(0, 3);

        let trendsText = '';
        topTrends.forEach((t: any, i: number) => {
          trendsText += `🔹 *${t.topic || t.title}:* ${t.whyTrending || t.description}\n`;
        });

        let ideasText = '';
        topIdeas.forEach((id: any, i: number) => {
          ideasText += `💡 *Idea ${i + 1} (${id.format || 'Reel'}):* "${id.title || id.hook}"\n`;
        });

        // Guardar contexto del radar en la sesión para encadenar con opción 4 o 5
        await chatDocRef.set({
          lastRadarContext: {
            rubro,
            trends: topTrends.map((t: any) => t.topic || t.title),
            ideas: topIdeas.map((id: any) => ({
              title: id.title || id.hook,
              format: id.format || 'Post',
            })),
          },
          lastAction: '3',
          updatedAt: new Date(),
        }, { merge: true });

        replyText =
          `📡 *Radar de Nicho para ${rubro} (${businessName})*\n\n` +
          `🔥 *Tendencias detectadas por nuestros agentes:*\n` +
          trendsText +
          `\n🎯 *Propuestas para aprovechar hoy:*\n` +
          ideasText +
          `\n━━━━━━━━━━━━━━━\n` +
          `🎯 *¿Cómo deseas aprovechar estas oportunidades?*\n` +
          `• Responde *4* para crear un post puntual (o *4 1*, *4 2*, *4 3* para elegir una de las ideas).\n` +
          `• Responde *5* para planificar una estrategia de 1 semana (3 posts agendados) inspirada en este radar.\n` +
          `• O escribe *0* para volver al menú principal.` +
          multiAccountFooter;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 4: Crear nuevo post puntual (Ahora vs Continuación)
      // ----------------------------------------------------
      case '4': {
        let userPrompt = text.replace(/^4\s*/i, '').trim();

        // Si el usuario eligió una idea del radar ("4 1", "4 2", "4 3", o solo "1", "2")
        const radarCtx = chatData?.lastRadarContext;
        const matchNumber = userPrompt.match(/^[1-3]$/);
        if (matchNumber && radarCtx?.ideas?.[parseInt(matchNumber[0], 10) - 1]) {
          const selected = radarCtx.ideas[parseInt(matchNumber[0], 10) - 1];
          userPrompt = selected.title;
        } else if (!userPrompt && chatData?.lastAction === '3' && radarCtx?.ideas?.[0]) {
          userPrompt = radarCtx.ideas[0].title;
        }

        const model = getFreeModel(
          undefined,
          `Eres un copywriter profesional de redes sociales para PyMEs en Chile y LATAM.
Aplica obligatoriamente el principio humanize:
- Habla de tú a tú, directo, con voz cálida y cercana.
- CERO muletillas de IA (prohibido "en el vertiginoso mundo", "en conclusión", "desbloquea el potencial", "sumérgete en", etc.).
- NUNCA menciones que eres una IA o Inteligencia Artificial. Habla como "nuestros agentes".
- Sé directo, usa 1 o 2 emojis naturales y sugiere 4 hashtags al final.`
        );

        const promptText = userPrompt
          ? `Crea un post para el negocio "${businessName}" del rubro "${rubro}". Tema específico solicitado por el cliente: "${userPrompt}".`
          : `Crea una publicación atractiva para el negocio "${businessName}" del rubro "${rubro}", enfocada en destacar sus productos o servicios esta semana.`;

        const result = await model.generateContent(promptText);
        const generatedCopy = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        // Detección de inmediatez solicitada por el usuario
        const wantsNow = /ahora|hoy|ya|inmediat|urgente|ahorita/i.test(cleanInput);
        const continuity = await getNextScheduleSlotServer({ userId, profileId, targetHour: 18 });

        // Detección de redes específicas solicitadas en el prompt o predeterminadas
        let chosenNetworks: string[] | null = null;
        if (userPrompt) {
          const detected = extractNetworksFromPhrase(userPrompt);
          if (detected.length > 0 && /\b(solo|para|en|redes|únicamente|unicamente)\b/i.test(userPrompt)) {
            chosenNetworks = detected;
          }
        }
        const targetNetworks = chosenNetworks && chosenNetworks.length > 0
          ? chosenNetworks
          : getConnectedNetworks(currentAccount.profileDoc, currentAccount.userDoc);

        let scheduledDate = new Date(Date.now() + 2 * 60 * 1000);
        let publishMode = 'now';

        if (!wantsNow && !continuity.hasFuturePosts) {
          scheduledDate = continuity.nextAvailableDate;
          publishMode = 'tomorrow';
        } else if (!wantsNow && continuity.hasFuturePosts) {
          publishMode = 'ask_or_now';
        }

        const newPostRef = await adminDb.collection('social_posts').add({
          userId,
          profileId,
          businessName,
          idea: userPrompt || `Publicación destacada para ${businessName}`,
          postText: generatedCopy,
          copy: generatedCopy,
          type: 'Post',
          scheduledFor: scheduledDate,
          queueDate: continuity.nextAvailableDate,
          publishMode,
          networks: targetNetworks,
          status: 'pending',
          createdAt: new Date(),
          generatedBy: 'whatsapp_post',
        });

        // Guardar el ID directamente en la sesión del chat para recuperarlo sin depender de índices de cuenta
        await chatDocRef.set({
          lastPendingPostId: newPostRef.id,
          lastPendingPostIds: [newPostRef.id],
          lastPendingUserId: userId,
          lastPendingProfileId: profileId,
          lastPendingBusinessName: businessName,
          activeAccountIndex: activeIndex,
          lastAction: '4',
          updatedAt: new Date(),
        }, { merge: true });

        const formattedNets = formatNetworks(targetNetworks);
        const networksTip = `\n💡 _Para cambiar redes responde: "solo instagram", "agregar linkedin" o "sin facebook"._`;

        if (wantsNow) {
          replyText =
            `✨ *Propuesta creada por nuestros agentes para ${businessName}:*\n\n` +
            `${generatedCopy}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `⚡ *Momento de publicación:* Publicación inmediata (AHORA)\n` +
            `📱 *Redes asignadas:* ${formattedNets}\n\n` +
            `👉 *Responde 6* para aprobar y que nuestros agentes lo publiquen de inmediato.` +
            networksTip +
            multiAccountFooter;
        } else if (continuity.hasFuturePosts) {
          const nextDateFormatted = format(continuity.nextAvailableDate, "EEEE d 'de' MMMM, HH:mm", { locale: es });
          replyText =
            `✨ *Propuesta creada por nuestros agentes para ${businessName}:*\n\n` +
            `${generatedCopy}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `📱 *Redes asignadas:* ${formattedNets}\n` +
            `📅 *¿Cuándo prefieres que se publique?*\n` +
            `• Responde *6* para publicarlo *AHORA* de inmediato.\n` +
            `• Responde *6 COLA* para sumarlo a tu calendario agendado (*${nextDateFormatted} hrs*).` +
            networksTip +
            multiAccountFooter;
        } else {
          replyText =
            `✨ *Propuesta creada por nuestros agentes para ${businessName}:*\n\n` +
            `${generatedCopy}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `📱 *Redes asignadas:* ${formattedNets}\n` +
            `📅 *¿Cuándo prefieres que se publique?*\n` +
            `• Responde *6* para agendarlo para *mañana a las 18:00 hrs*.\n` +
            `• Responde *6 AHORA* para publicarlo de inmediato.` +
            networksTip +
            multiAccountFooter;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 5: Planificar Estrategia (1 o 2 Semanas) 🗓️
      // ----------------------------------------------------
      case '5': {
        const userTopic = text.replace(/^5\s*/i, '').trim();

        // Determinar si la estrategia es de 1 semana o 2 semanas
        const isOneWeek =
          cleanInput.includes('1') ||
          cleanInput.includes('una') ||
          cleanInput.includes('1 semana') ||
          (cleanInput.includes('semana') && !cleanInput.includes('2')) ||
          (chatData?.lastAction === '3' && !cleanInput.includes('2'));

        const targetWeeks = isOneWeek ? 1 : 2;
        const postCount = isOneWeek ? 3 : 5;
        const dayOffsets = isOneWeek ? [0, 2, 4] : [0, 3, 6, 9, 12];
        const strategyTag = isOneWeek ? 'whatsapp_strategy_1week' : 'whatsapp_strategy_2weeks';

        // 1. Obtener continuidad del calendario
        const continuity = await getNextScheduleSlotServer({ userId, profileId, targetHour: 18 });
        const baseDate = continuity.hasFuturePosts
          ? new Date(continuity.nextAvailableDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);
        baseDate.setHours(18, 0, 0, 0);

        // Detección de redes específicas solicitadas en el topic o predeterminadas
        let chosenStrategyNetworks: string[] | null = null;
        if (userTopic) {
          const detected = extractNetworksFromPhrase(userTopic);
          if (detected.length > 0 && /\b(solo|para|en|redes|únicamente|unicamente)\b/i.test(userTopic)) {
            chosenStrategyNetworks = detected;
          }
        }
        const strategyNetworks = chosenStrategyNetworks && chosenStrategyNetworks.length > 0
          ? chosenStrategyNetworks
          : getConnectedNetworks(currentAccount.profileDoc, currentAccount.userDoc);

        const systemInstruction = `Eres un estratega senior de contenidos y copywriter para redes sociales de PyMEs en Chile y LATAM.
Aplica obligatoriamente las reglas de humanización:
- Tono directo ("tú a tú"), cercano, profesional y fresco.
- CERO muletillas de IA (prohibido "en el vertiginoso mundo actual", "en conclusión", "desbloquea el potencial", "sumérgete en", etc.).
- NUNCA uses los términos "IA" o "Inteligencia Artificial"; habla siempre de "nuestros agentes" o del equipo.
- Cada copy debe estar listo para Instagram y Facebook, con 1 o 2 emojis naturales y 4 hashtags al final.`;

        // Contexto de radar si está disponible
        const radarCtx = chatData?.lastRadarContext;
        let contextAddition = '';
        if (radarCtx?.trends?.length) {
          contextAddition = `Inspirado en las siguientes tendencias del radar de nicho: ${radarCtx.trends.join(', ')}. Ideas detectadas: ${radarCtx.ideas?.map((i: any) => i.title).join(' | ')}.`;
        }

        const promptText = `Diseña un plan editorial estratégico de ${targetWeeks} semana${targetWeeks > 1 ? 's' : ''} (${postCount} publicaciones) para el negocio "${businessName}" del rubro "${rubro}".
${userTopic ? `Enfoque o tema especial pedido por el cliente: "${userTopic}".` : 'Enfoque: destacar el valor del negocio, responder dudas frecuentes de clientes, generar confianza y llamados claros a cotizar o contactar.'}
${contextAddition}

Distribución del contenido:
${isOneWeek
  ? `Post 1: Consejo práctico o tip del rubro que resuelva una duda típica.
Post 2: Error común que comete la gente y cómo solucionarlo con ${businessName}.
Post 3: Llamado directo a la acción o beneficio concreto para cotizar/agendar.`
  : `Post 1: Consejo o tip práctico del rubro que resuelva un dolor típico del cliente.
Post 2: Error común que la gente comete y cómo solucionarlo con ${businessName}.
Post 3: Prueba social, caso de éxito o beneficio concreto contado con calidez.
Post 4: Pregunta de debate o interacción que invite a comentar a la comunidad.
Post 5: Oferta clara o llamado a cotizar/escribir por mensaje directo (DM o WhatsApp).`
}

Responde ÚNICAMENTE un objeto JSON válido con este formato:
{
  "posts": [
    {
      "theme": "Título o tema (máx 6 palabras)",
      "hook": "Gancho inicial llamativo (1 frase)",
      "copy": "Texto completo del post listo para publicar, humanizado, con emojis y 4 hashtags al final.",
      "type": "Post"
    }
  ]
}`;

        let generatedPosts: Array<{ theme: string; hook: string; copy: string; type?: string }> = [];

        try {
          const rawJson = await generateFreeText(promptText, systemInstruction, true, undefined, 'strategy_generation');
          const cleanJson = rawJson.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
            generatedPosts = parsed.posts.slice(0, postCount);
          }
        } catch (err) {
          console.warn('Error generando estrategia con Gemini, aplicando fallback estructurado:', err);
        }

        if (generatedPosts.length === 0) {
          const fallbackPool = [
            {
              theme: `Tip práctico de ${rubro}`,
              hook: `¿Sabías que este pequeño hábito puede cambiar tus resultados por completo?`,
              copy: `En ${businessName} creemos que los grandes cambios empiezan con decisiones simples. Un consejo que siempre damos a nuestros clientes: enfócate en la constancia antes que en la perfección.\n\n¿Qué hábito te ha servido más a ti? Déjanos un comentario. 👇\n\n#Tips #${rubro.replace(/\s+/g, '')} #Santisoft #${businessName.replace(/\s+/g, '')}`,
              type: 'Post',
            },
            {
              theme: `El error más común en ${rubro}`,
              hook: `El 80% comete este error al empezar y termina perdiendo tiempo valioso.`,
              copy: `Muchas veces queremos hacer todo a la vez y nos olvidamos de lo esencial. En ${businessName} te ayudamos a simplificar tus procesos para que te enfoques en lo que de verdad importa.\n\nEscríbenos por mensaje directo si quieres que te asesoremos. 📩\n\n#Soluciones #${rubro.replace(/\s+/g, '')} #PyME #Consejos`,
              type: 'Post',
            },
            {
              theme: `Beneficio clave`,
              hook: `Así es cómo nuestros clientes ganan tranquilidad cada semana.`,
              copy: `Contar con el respaldo de ${businessName} te permite delegar con confianza. Nos encargamos de que todo funcione como reloj suizo para que tú disfrutes de los resultados.\n\nRevisa más detalles en el enlace de nuestra bio. 🔗\n\n#Tranquilidad #Resultados #${businessName.replace(/\s+/g, '')} #Chile`,
              type: 'Post',
            },
            {
              theme: `Pregunta a la comunidad`,
              hook: `Pregunta rápida: ¿Qué es lo primero que buscas en un servicio de este tipo?`,
              copy: `Nos interesa mucho saber qué opinas. Para nosotros la experiencia de cada cliente es prioridad absoluta.\n\nResponde en un comentario: ¿Rapidez, cercanía o precio? Te leemos. 👀\n\n#Comunidad #Conversación #${rubro.replace(/\s+/g, '')} #Opinión`,
              type: 'Post',
            },
            {
              theme: `Llamado a la acción`,
              hook: `¡Cotiza con nosotros esta semana y asegura tu atención personalizada!`,
              copy: `¿Listo para dar el siguiente paso con ${businessName}? Nuestro equipo está preparado para ayudarte a alcanzar tus metas.\n\nHaz clic en el enlace de nuestro perfil o envíanos un WhatsApp directo. 📲\n\n#Cotizaciones #Oferta #${businessName.replace(/\s+/g, '')} #Servicios`,
              type: 'Post',
            },
          ];
          generatedPosts = fallbackPool.slice(0, postCount);
        }

        const newPostIds: string[] = [];
        let summaryList = '';

        for (let i = 0; i < generatedPosts.length; i++) {
          const p = generatedPosts[i];
          const postDate = new Date(baseDate.getTime() + (dayOffsets[i] || i * 2) * 24 * 60 * 60 * 1000);
          postDate.setHours(18, 0, 0, 0);

          const postRef = await adminDb.collection('social_posts').add({
            userId,
            profileId,
            businessName,
            idea: `${p.theme}: ${p.hook}`,
            postText: p.copy,
            copy: p.copy,
            type: p.type || 'Post',
            scheduledFor: postDate,
            queueDate: postDate,
            publishMode: 'queue',
            networks: strategyNetworks,
            status: 'pending',
            generatedBy: strategyTag,
            createdAt: new Date(),
          });

          newPostIds.push(postRef.id);

          const dateStr = format(postDate, "EEEE d 'de' MMMM", { locale: es });
          summaryList += `*${i + 1}.* 📅 *${dateStr} (18:00 hrs)*\n` +
                         `📌 *${p.theme}*\n` +
                         `📝 "${p.hook}"\n\n`;
        }

        await chatDocRef.set({
          lastPendingPostIds: newPostIds,
          lastPendingPostId: newPostIds[0],
          lastPendingUserId: userId,
          lastPendingProfileId: profileId,
          lastPendingBusinessName: businessName,
          activeAccountIndex: activeIndex,
          lastAction: '5',
          updatedAt: new Date(),
        }, { merge: true });

        const continuityNote = continuity.hasFuturePosts
          ? `_(Inicia a continuación de tu último post agendado)_`
          : `_(Inicia a partir de mañana)_`;

        replyText =
          `🗓️ *Estrategia de ${targetWeeks} semana${targetWeeks > 1 ? 's' : ''} para ${businessName}*\n` +
          `${continuityNote}\n\n` +
          `Nuestros agentes estructuraron un calendario continuo de ${postCount} publicaciones estratégicas:\n` +
          `📱 *Redes asignadas:* ${formatNetworks(strategyNetworks)}\n\n` +
          summaryList +
          `━━━━━━━━━━━━━━━\n` +
          `👉 *Responde 6* para aprobar toda la estrategia y que quede agendada en tu calendario.\n` +
          `💡 _Para cambiar redes en estos posts, responde ej: "solo instagram", "agregar linkedin" o "sin facebook"._\n` +
          `👉 Puedes ver y editar cada texto completo en tu panel web:\n` +
          `https://rrss.santisoft.cl/automatizacion-rrss/panel\n\n` +
          `_Escribe *0* para volver al menú principal._` +
          multiAccountFooter;
        break;
      }

      // ----------------------------------------------------
      // GESTIÓN DE REDES SOCIALES PARA POSTS PENDIENTES
      // ----------------------------------------------------
      case 'redes': {
        // 1. Localizar posts pendientes en la sesión o Firestore
        const sessionPostIds: string[] = Array.isArray(chatData?.lastPendingPostIds) && chatData.lastPendingPostIds.length > 0
          ? chatData.lastPendingPostIds
          : (chatData?.lastPendingPostId ? [chatData.lastPendingPostId] : []);

        let pendingDocs: Array<{ id: string; ref: any; data: () => any }> = [];

        if (sessionPostIds.length > 0) {
          for (const pId of sessionPostIds) {
            const pSnap = await adminDb.collection('social_posts').doc(pId).get();
            if (pSnap.exists) {
              const pData = pSnap.data();
              if (pData?.status === 'pending') {
                pendingDocs.push({
                  id: pSnap.id,
                  ref: pSnap.ref,
                  data: () => pData,
                });
              }
            }
          }
        }

        if (pendingDocs.length === 0) {
          const userIdsToSearch = Array.from(new Set([userId, ...matchedAccounts.map((a) => a.userId)]));
          for (const uId of userIdsToSearch) {
            const snap = await adminDb
              .collection('social_posts')
              .where('userId', '==', uId)
              .where('status', '==', 'pending')
              .get();

            snap.docs.forEach((d) => {
              const pData = d.data();
              if (!pData.profileId || pData.profileId === profileId || userIdsToSearch.length === 1) {
                pendingDocs.push({
                  id: d.id,
                  ref: d.ref,
                  data: () => pData,
                });
              }
            });
          }
        }

        const connected = getConnectedNetworks(currentAccount.profileDoc, currentAccount.userDoc);

        if (pendingDocs.length === 0) {
          replyText =
            `📱 *Gestión de Redes Sociales (${businessName})*\n\n` +
            `Actualmente no tienes publicaciones pendientes de aprobación para modificar.\n\n` +
            `🔗 *Tus redes configuradas en el panel son:*\n${formatNetworks(connected)}\n\n` +
            `👉 *Escribe 4* para crear una nueva publicación (ej: _"4 Post sobre tips solo en instagram"_) o *1* para revisar tus publicaciones agendadas.` +
            multiAccountFooter;
          break;
        }

        // Post de referencia
        const firstPost = pendingDocs[0].data();
        let currentNetworks: string[] = Array.isArray(firstPost.networks) && firstPost.networks.length > 0
          ? [...firstPost.networks]
          : [...connected];

        let targetNetworks: string[] = [];

        const isSolo = /\b(solo|unicamente|solamente)\b/i.test(cleanInput);
        const isAdd = /\b(agregar|sumar|incluir|anadir|añadir)\b/i.test(cleanInput);
        const isRemove = /\b(quitar|sacar|sin|eliminar|remover)\b/i.test(cleanInput);
        const mentioned = extractNetworksFromPhrase(cleanInput);

        if (isSolo && mentioned.length > 0) {
          targetNetworks = mentioned;
        } else if (isAdd && mentioned.length > 0) {
          targetNetworks = Array.from(new Set([...currentNetworks, ...mentioned]));
        } else if (isRemove && mentioned.length > 0) {
          targetNetworks = currentNetworks.filter((n) => !mentioned.includes(n));
          if (targetNetworks.length === 0) {
            replyText =
              `⚠️ *Atención en ${businessName}:*\n\n` +
              `No es posible dejar la publicación sin ninguna red social asignada.\n` +
              `Debes mantener al menos una red activa (por ejemplo: Instagram o Facebook).\n\n` +
              `📱 *Redes activas actuales:* ${formatNetworks(currentNetworks)}\n` +
              `👉 Responde *6* para aprobar o indica otra red.` +
              multiAccountFooter;
            break;
          }
        } else if (mentioned.length > 0) {
          targetNetworks = mentioned;
        } else {
          // El usuario solo puso "redes" o no especificó ninguna válida
          replyText =
            `📱 *Redes asignadas a tu publicación pendiente (${businessName}):*\n\n` +
            `${formatNetworks(currentNetworks)}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `💡 *¿Cómo deseas ajustarlas? Responde con:*\n` +
            `• _"solo instagram"_ (deja únicamente Instagram)\n` +
            `• _"agregar linkedin"_ (suma LinkedIn)\n` +
            `• _"sin facebook"_ (quita Facebook)\n` +
            `• _"redes ig, linkedin"_ (elige las redes exactas)\n\n` +
            `👉 O responde *6* para aprobarlas tal como están (o *6 COLA* para agendar).` +
            multiAccountFooter;
          break;
        }

        // Actualizar en Firestore para todos los pendientes
        for (const pDoc of pendingDocs) {
          await pDoc.ref.update({
            networks: targetNetworks,
            updatedAt: new Date(),
          });
        }

        const countText = pendingDocs.length > 1
          ? `en tus *${pendingDocs.length} publicaciones pendientes*`
          : `en tu *publicación pendiente*`;

        replyText =
          `✅ *Redes actualizadas con éxito (${businessName})*\n\n` +
          `Nuestros agentes ajustaron las redes ${countText}.\n\n` +
          `📱 *Publicará en:* ${formatNetworks(targetNetworks)}\n\n` +
          `━━━━━━━━━━━━━━━\n` +
          `👉 *Responde 6* para publicar de inmediato.\n` +
          `👉 *Responde 6 COLA* para agendar en la fecha programada.\n` +
          `💡 _Puedes seguir ajustando respondiendo ej: "agregar tiktok" o "sin facebook"._` +
          multiAccountFooter;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 6: Aprobar posts pendientes (Ahora vs Cola)
      // ----------------------------------------------------
      case '6': {
        const wantsQueue = cleanInput.includes('cola') || cleanInput.includes('agendar') || cleanInput.includes('calendario');
        const wantsNow = cleanInput.includes('ahora') || cleanInput.includes('ya') || cleanInput.includes('inmediat') || cleanInput === '6 ahora';

        // 1. Prioridad: Buscar los IDs registrados directamente en la sesión del chat
        const sessionPostIds: string[] = Array.isArray(chatData?.lastPendingPostIds) && chatData.lastPendingPostIds.length > 0
          ? chatData.lastPendingPostIds
          : (chatData?.lastPendingPostId ? [chatData.lastPendingPostId] : []);

        let pendingDocs: Array<{ id: string; ref: any; data: () => any }> = [];

        if (sessionPostIds.length > 0) {
          for (const pId of sessionPostIds) {
            const pSnap = await adminDb.collection('social_posts').doc(pId).get();
            if (pSnap.exists) {
              const pData = pSnap.data();
              if (pData?.status === 'pending') {
                pendingDocs.push({
                  id: pSnap.id,
                  ref: pSnap.ref,
                  data: () => pData,
                });
              }
            }
          }
        }

        // 2. Fallback: Buscar en Firestore si no había IDs en sesión o ya no están pendientes
        if (pendingDocs.length === 0) {
          const userIdsToSearch = Array.from(new Set([userId, ...matchedAccounts.map((a) => a.userId)]));
          for (const uId of userIdsToSearch) {
            const snap = await adminDb
              .collection('social_posts')
              .where('userId', '==', uId)
              .where('status', '==', 'pending')
              .get();

            snap.docs.forEach((d) => {
              const pData = d.data();
              if (!pData.profileId || pData.profileId === profileId || userIdsToSearch.length === 1) {
                pendingDocs.push({
                  id: d.id,
                  ref: d.ref,
                  data: () => pData,
                });
              }
            });
          }
        }

        if (pendingDocs.length === 0) {
          replyText =
            `👍 *Todo al día en ${businessName}:*\n\n` +
            `No tienes publicaciones pendientes de aprobación en este momento.\n\n` +
            `_Escribe *1* para revisar los posts que ya están agendados, *4* para crear uno nuevo o *5* para planificar 2 semanas._` +
            multiAccountFooter;
        } else if (pendingDocs.length === 1) {
          // Aprobación de un único post puntual
          const postDoc = pendingDocs[0];
          const p = postDoc.data();
          const targetBusinessName = p.businessName || chatData?.lastPendingBusinessName || businessName;
          let targetDate: Date;

          if (wantsQueue) {
            if (p.queueDate) {
              const rawQueue = p.queueDate.toDate ? p.queueDate.toDate() : new Date(p.queueDate);
              targetDate = rawQueue.getTime() > Date.now() + 5 * 60 * 1000 ? rawQueue : new Date(Date.now() + 24 * 60 * 60 * 1000);
            } else {
              const cont = await getNextScheduleSlotServer({ userId: p.userId || userId, profileId: p.profileId || profileId, targetHour: 18 });
              targetDate = cont.nextAvailableDate;
            }
          } else if (wantsNow || p.publishMode === 'now' || p.publishMode === 'ask_or_now') {
            targetDate = new Date(Date.now() + 60 * 1000);
          } else {
            const rawSched = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor || Date.now() + 60 * 1000);
            targetDate = rawSched.getTime() > Date.now() + 5 * 60 * 1000 ? rawSched : new Date(Date.now() + 60 * 1000);
          }

          await enqueuePostTask(postDoc.id, targetDate);
          await postDoc.ref.update({
            status: 'confirmed',
            scheduledFor: targetDate,
            publishError: null,
            confirmedAt: new Date(),
            confirmedVia: 'whatsapp',
          });

          // Limpiar el post pendiente de la sesión
          await chatDocRef.set({
            lastPendingPostId: null,
            lastPendingPostIds: [],
          }, { merge: true });

          const isImmediate = targetDate.getTime() <= Date.now() + 5 * 60 * 1000;
          const dateFormatted = format(targetDate, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
          const ideaSnippet = (p.idea || p.copy || p.postText || '').slice(0, 95);
          const postNets = formatNetworks(p.networks || ['instagram', 'facebook']);

          if (isImmediate) {
            replyText =
              `🚀 *¡Publicación aprobada para salir AHORA en ${targetBusinessName}!* ⚡\n\n` +
              `Nuestros agentes están despachando tu contenido a ${postNets} en este mismo instante.\n\n` +
              `📝 *Contenido:* "${ideaSnippet}..."\n\n` +
              `_En breves momentos estará visible en tus redes. Escribe *1* para ver tu calendario o *2* para el historial._` +
              multiAccountFooter;
          } else {
            replyText =
              `🎉 *¡Publicación agendada con éxito para ${targetBusinessName}!* 📅\n\n` +
              `📅 *Fecha de publicación:* ${dateFormatted} hrs (continuación de tu calendario agendado).\n` +
              `📱 *Redes vinculadas:* ${postNets}\n` +
              `📝 *Contenido agendado:*\n"${ideaSnippet}..."\n\n` +
              `✅ Nuestros agentes la publicarán automáticamente en la fecha indicada. Ya puedes visualizarla en tu panel web:\n` +
              `https://rrss.santisoft.cl/automatizacion-rrss/panel` +
              multiAccountFooter;
          }
        } else {
          // Aprobación múltiple (estrategia de 2 semanas o lote)
          const targetBusinessName = chatData?.lastPendingBusinessName || businessName;
          const confirmedDates: Date[] = [];

          for (const postDoc of pendingDocs) {
            const p = postDoc.data();
            let targetDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor || Date.now() + 24 * 60 * 60 * 1000);
            if (targetDate.getTime() <= Date.now() + 5 * 60 * 1000) {
              targetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            }
            confirmedDates.push(targetDate);

            await enqueuePostTask(postDoc.id, targetDate);
            await postDoc.ref.update({
              status: 'confirmed',
              scheduledFor: targetDate,
              publishError: null,
              confirmedAt: new Date(),
              confirmedVia: 'whatsapp',
            });
          }

          // Limpiar la lista de pendientes de la sesión
          await chatDocRef.set({
            lastPendingPostId: null,
            lastPendingPostIds: [],
          }, { merge: true });

          confirmedDates.sort((a, b) => a.getTime() - b.getTime());
          const firstDateStr = format(confirmedDates[0], "d 'de' MMMM", { locale: es });
          const lastDateStr = format(confirmedDates[confirmedDates.length - 1], "d 'de' MMMM", { locale: es });
          const sampleNetworks = pendingDocs[0]?.data()?.networks || ['instagram', 'facebook'];
          const strategyType = pendingDocs.length > 3 ? '2 semanas' : '1 semana';

          replyText =
            `🎉 *¡Estrategia de ${strategyType} agendada con éxito para ${targetBusinessName}!* 🗓️\n\n` +
            `Se han confirmado *${pendingDocs.length} publicaciones* en tu calendario:\n` +
            `📅 *Período cubierto:* Del ${firstDateStr} al ${lastDateStr}\n` +
            `📱 *Redes vinculadas:* ${formatNetworks(sampleNetworks)}\n\n` +
            `Nuestros agentes se encargarán de despachar cada post en su fecha y hora asignada de forma totalmente automática. 🚀\n\n` +
            `✅ Puedes revisar o editar cada publicación en tu panel:\n` +
            `https://rrss.santisoft.cl/automatizacion-rrss/panel` +
            multiAccountFooter;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 7: Ver Cuota y Estadísticas
      // ----------------------------------------------------
      case '7': {
        const [usedPosts, maxPosts, maxVideos] = await Promise.all([
          getQuotaUsageAdmin(userId, profileId).catch(() => 0),
          getPlanLimitAdmin(userPlan, email).catch(() => 20),
          getAiPlanLimitAdmin(userPlan, 'video', email).catch(() => 2),
        ]);

        const percentage = maxPosts > 0 && maxPosts < 99999 ? Math.round((usedPosts / maxPosts) * 100) : 0;
        const available = maxPosts >= 99999 ? 'Ilimitados' : Math.max(0, maxPosts - usedPosts);

        replyText =
          `📊 *Rendimiento y Cuota de ${businessName}*\n\n` +
          `💳 *Plan Actual:* ${userPlan.toUpperCase()}\n` +
          `📝 *Publicaciones Usadas este Mes:* ${usedPosts} de ${maxPosts >= 99999 ? '∞' : maxPosts} (${percentage}%)\n` +
          `✨ *Disponibles para el ciclo:* ${available}\n` +
          `🎬 *Límite de Reels/Videos:* ${maxVideos >= 99999 ? 'Ilimitados' : maxVideos}\n\n` +
          `_Tus agentes están operando de forma continua. Escribe *0* para ver el menú principal._` +
          multiAccountFooter;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 8: Cambiar de cuenta (Fallback directo)
      // ----------------------------------------------------
      case '8': {
        if (hasMultipleAccounts) {
          let accountsList = '';
          matchedAccounts.forEach((acc, idx) => {
            const isCurrent = idx === activeIndex ? ' *(Actual)*' : '';
            accountsList += `*${idx + 1}.* ${acc.businessName} (${acc.rubro}) - _${acc.email}_${isCurrent}\n`;
          });

          replyText =
            `🏢 *Cuentas disponibles asociadas a tu teléfono:*\n\n` +
            accountsList +
            `\n👉 Responde con *C1*, *C2*, *C3*... para seleccionar la cuenta que deseas gestionar.\n` +
            `_Ejemplo: Escribe *C1* para elegir la primera opción._`;
        } else {
          replyText =
            `ℹ️ *Tu teléfono solo tiene vinculada la cuenta de ${businessName}.*\n\n` +
            `Si necesitas añadir otra cuenta o negocio, puedes hacerlo desde tu panel web en *Configuración > Perfiles*.\n\n` +
            `_Escribe *0* para volver al menú principal._`;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 0 / DEFAULT: Menú Principal
      // ----------------------------------------------------
      default: {
        const switchOptionText = hasMultipleAccounts ? `8️⃣ *Cambiar de cuenta / negocio*\n` : '';

        replyText =
          `👋 *¡Hola ${pushName}! Te damos la bienvenida a Santisoft.*\n` +
          `Gestionando: *${businessName}* (${rubro})\n\n` +
          `¿Qué necesitas gestionar hoy? Responde con un número:\n\n` +
          `1️⃣ *Próximos posts agendados*\n` +
          `2️⃣ *Posts ya publicados (historial)*\n` +
          `3️⃣ *Radar de nicho y tendencias*\n` +
          `4️⃣ *Crear post puntual (AHORA o en cola)*\n` +
          `5️⃣ *Planificar estrategia (2 semanas) 🗓️*\n` +
          `6️⃣ *Aprobar posts pendientes*\n` +
          `7️⃣ *Ver cuota y estadísticas*\n` +
          switchOptionText +
          `\n_Escribe el número de la opción que prefieras._\n\n` +
          `🛡️ _Tip de seguridad: Guarda este número (+56 9 6590 9543) como *Santisoft Agentes* en tus contactos para asegurar tus alertas y evitar bloqueos._` +
          multiAccountFooter;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      replyText,
      businessName,
      userPlan,
      actionExecuted: action,
      hasMultipleAccounts,
    });
  } catch (error: any) {
    console.error('Error procesando bot-action de WhatsApp:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
        replyText: 'Ocurrió un pequeño inconveniente al procesar tu solicitud. Por favor intenta nuevamente en unos momentos.',
      },
      { status: 200 }
    );
  }
}
