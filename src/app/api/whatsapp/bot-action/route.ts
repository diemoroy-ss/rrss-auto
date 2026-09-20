import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateNicheRadarAnalysis } from '../../../../lib/niche-radar';
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from '../../../../lib/quota';
import { enqueuePostTask } from '../../../../lib/gcp-tasks';
import { getFreeModel } from '../../../../lib/gemini-free';
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

    // 1. Buscar TODAS las cuentas y perfiles que tengan este teléfono asociado
    const matchedAccounts: AccountOption[] = [];
    const usersSnap = await adminDb.collection('users').get();

    for (const doc of usersSnap.docs) {
      const uData = doc.data();
      const userPhone = (uData.phone || uData.whatsappPhone || '').replace(/\D/g, '');
      const isUserPhoneMatch =
        userPhone && (userPhone === cleanPhone || cleanPhone.endsWith(userPhone) || userPhone.endsWith(cleanPhone));

      const profiles = Array.isArray(uData.profiles) ? uData.profiles : [];

      if (profiles.length > 0) {
        profiles.forEach((p: any) => {
          const pPhone = (p.phone || p.whatsappPhone || '').replace(/\D/g, '');
          const isProfilePhoneMatch =
            pPhone && (pPhone === cleanPhone || cleanPhone.endsWith(pPhone) || pPhone.endsWith(cleanPhone));

          if (isUserPhoneMatch || isProfilePhoneMatch) {
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
      } else if (isUserPhoneMatch) {
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

    // Si el usuario no tiene ninguna cuenta asociada
    if (matchedAccounts.length === 0) {
      const notFoundMessage =
        `¡Hola ${pushName}! 👋\n\n` +
        `No encontramos una cuenta de Santisoft asociada a este número de teléfono (*${phone}*).\n\n` +
        `Para vincular tu cuenta:\n` +
        `1. Ingresa a tu panel en https://rrss.santisoft.cl\n` +
        `2. Ve a *Configuración / Perfil*\n` +
        `3. Añade este número en tu teléfono de contacto y guarda los cambios.\n\n` +
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
      action === '7' ||
      cleanInput === '7' ||
      cleanInput.includes('cambiar cuenta') ||
      cleanInput.includes('otra cuenta') ||
      cleanInput.includes('cambiar negocio') ||
      cleanInput === 'cuentas';

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
          `4️⃣ Crear nuevo post\n` +
          `5️⃣ Ver cuota\n` +
          `6️⃣ Aprobar pendientes\n\n` +
          `_💡 Recuerda: Puedes escribir *7* o *CAMBIAR* en cualquier momento para volver a otra cuenta._`;

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

    // Nota que se agrega al final si tiene varias cuentas conectadas
    const multiAccountFooter = hasMultipleAccounts
      ? `\n\n━━━━━━━━━━━━━━━\n🔄 _Gestionando: *${businessName}*. Tienes ${matchedAccounts.length} cuentas vinculadas. Escribe *7* o *CAMBIAR* para alternar._`
      : '';

    let replyText = '';

    // 3. Ejecutar la acción
    switch (action) {
      // ----------------------------------------------------
      // OPCIÓN 1: Ver próximos posts agendados
      // ----------------------------------------------------
      case '1': {
        const postsSnap = await adminDb
          .collection('social_posts')
          .where('userId', '==', userId)
          .limit(30)
          .get();

        const upcomingPosts = postsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p) => (p.status === 'confirmed' || p.status === 'pending') && (!p.profileId || p.profileId === profileId))
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
            `👉 *Escribe 4* para que nuestros agentes creen una nueva idea o planificación para ti.` +
            multiAccountFooter;
        } else {
          let list = '';
          upcomingPosts.forEach((p, idx) => {
            const dateObj = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
            const dateFormatted = format(dateObj, "EEEE d 'de' MMMM, HH:mm", { locale: es });
            const typeEmoji = (p.type || '').toLowerCase().includes('reel') ? '🎬' : '🖼️';
            const statusTag = p.status === 'confirmed' ? '⏳ Agendado' : '⏸️ Borrador pendiente';
            list += `*${idx + 1}.* ${typeEmoji} *${p.type || 'Post'}* (${statusTag})\n` +
                    `📅 ${dateFormatted}\n` +
                    `📝 "${(p.idea || p.copy || p.postText || '').slice(0, 100)}..."\n\n`;
          });

          replyText =
            `📅 *Próximas publicaciones para ${businessName}:*\n\n` +
            list +
            `_Escribe *6* si deseas confirmar los borradores pendientes, o *0* para volver al menú._` +
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
          .limit(30)
          .get();

        const publishedPosts = postsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p) => p.status === 'published' && (!p.profileId || p.profileId === profileId))
          .sort((a, b) => {
            const timeA = a.publishedAt?.toDate ? a.publishedAt.toDate().getTime() : (a.scheduledFor?.toDate ? a.scheduledFor.toDate().getTime() : 0);
            const timeB = b.publishedAt?.toDate ? b.publishedAt.toDate().getTime() : (b.scheduledFor?.toDate ? b.scheduledFor.toDate().getTime() : 0);
            return timeB - timeA;
          })
          .slice(0, 4);

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
            list += `*${idx + 1}.* ✅ *Publicado el ${dateFormatted}*\n` +
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

        replyText =
          `📡 *Radar de Nicho para ${rubro} (${businessName})*\n\n` +
          `🔥 *Tendencias detectadas por nuestros agentes:*\n` +
          trendsText +
          `\n🎯 *Propuestas para aprovechar hoy:*\n` +
          ideasText +
          `\n👉 _Escribe *4* para convertir una de estas ideas en una publicación agendada._` +
          multiAccountFooter;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 4: Crear nuevo post o planificar
      // ----------------------------------------------------
      case '4': {
        const userPrompt = text.replace(/^4\s*/i, '').trim();

        const model = getFreeModel(
          undefined,
          `Eres un copywriter profesional de redes sociales para PyMEs.
Crea un post promocional atractivo, cercano y en español de Chile/LATAM.
NUNCA menciones que eres una IA o Inteligencia Artificial. Habla como "nuestros agentes".
Sé directo, usa 1 o 2 emojis y sugiere 4 hashtags.`
        );

        const promptText = userPrompt
          ? `Crea un post para el negocio "${businessName}" del rubro "${rubro}". Tema específico solicitado por el cliente: "${userPrompt}".`
          : `Crea una publicación atractiva para el negocio "${businessName}" del rubro "${rubro}", enfocada en destacar sus productos o servicios esta semana.`;

        const result = await model.generateContent(promptText);
        const generatedCopy = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);

        await adminDb.collection('social_posts').add({
          userId,
          profileId,
          idea: userPrompt || `Publicación destacada para ${businessName}`,
          postText: generatedCopy,
          copy: generatedCopy,
          type: 'Post',
          scheduledFor: tomorrow,
          networks: ['instagram', 'facebook'],
          status: 'pending',
          createdAt: new Date(),
        });

        replyText =
          `✨ *Propuesta creada por nuestros agentes para ${businessName}:*\n\n` +
          `${generatedCopy}\n\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📅 *Horario sugerido:* Mañana a las 18:00 hrs.\n` +
          `📱 *Redes:* Instagram y Facebook\n\n` +
          `👉 *Responde 6* para aprobar y agendar este post de inmediato en piloto automático.` +
          multiAccountFooter;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 5: Ver Cuota y Estadísticas
      // ----------------------------------------------------
      case '5': {
        const [usedPosts, maxPosts, maxVideos] = await Promise.all([
          getQuotaUsage(userId, profileId),
          getPlanLimit(userPlan, email),
          getVideoPlanLimit(userPlan, email),
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
      // OPCIÓN 6: Aprobar posts pendientes
      // ----------------------------------------------------
      case '6': {
        const pendingSnap = await adminDb
          .collection('social_posts')
          .where('userId', '==', userId)
          .where('status', '==', 'pending')
          .get();

        const pendingDocs = pendingSnap.docs.filter((d) => {
          const data = d.data();
          return !data.profileId || data.profileId === profileId;
        });

        if (pendingDocs.length === 0) {
          replyText =
            `👍 *Todo al día en ${businessName}:*\n\n` +
            `No tienes publicaciones pendientes de aprobación en este momento.\n\n` +
            `_Escribe *1* para revisar los posts que ya están agendados o *4* para crear uno nuevo._` +
            multiAccountFooter;
        } else {
          let approvedCount = 0;
          for (const postDoc of pendingDocs) {
            const p = postDoc.data();
            const dateObj = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor);

            await enqueuePostTask(postDoc.id, dateObj);
            await postDoc.ref.update({
              status: 'confirmed',
              publishError: null,
            });
            approvedCount++;
          }

          replyText =
            `✅ *¡Excelente! Se han aprobado ${approvedCount} publicaciones para ${businessName}.*\n\n` +
            `Nuestros agentes se encargarán de publicarlas en la fecha y hora indicadas sin que tengas que hacer nada más. 🚀\n\n` +
            `_Escribe *1* para ver tu calendario agendado._` +
            multiAccountFooter;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 0 / DEFAULT: Menú Principal
      // ----------------------------------------------------
      default: {
        const switchOptionText = hasMultipleAccounts ? `7️⃣ *Cambiar de cuenta / negocio*\n` : '';

        replyText =
          `👋 *¡Hola ${pushName}! Te damos la bienvenida a Santisoft.*\n` +
          `Gestionando: *${businessName}* (${rubro})\n\n` +
          `¿Qué necesitas gestionar hoy? Responde con un número:\n\n` +
          `1️⃣ *Próximos posts agendados*\n` +
          `2️⃣ *Posts ya publicados (historial)*\n` +
          `3️⃣ *Radar de nicho y tendencias*\n` +
          `4️⃣ *Crear nuevo post o idea*\n` +
          `5️⃣ *Ver cuota y estadísticas*\n` +
          `6️⃣ *Aprobar posts pendientes*\n` +
          switchOptionText +
          `\n_Escribe el número de la opción que prefieras._` +
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
      { status: 500 }
    );
  }
}
