import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateNicheRadarAnalysis } from '../../../../lib/niche-radar';
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from '../../../../lib/quota';
import { enqueuePostTask } from '../../../../lib/gcp-tasks';
import { getFreeModel } from '../../../../lib/gemini-free';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

/**
 * Endpoint central para procesar acciones de WhatsApp provenientes de n8n / Evolution API.
 * Identifica al usuario por su número de teléfono y ejecuta la opción solicitada.
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

    // 1. Identificar usuario y perfil por teléfono
    // Limpiamos el teléfono entrante (quitando el código de país si es necesario)
    const cleanPhone = phone.replace(/\D/g, '');
    let matchedUser: any = null;
    let matchedProfile: any = null;
    let userId: string = '';

    const usersSnap = await adminDb.collection('users').get();
    for (const doc of usersSnap.docs) {
      const uData = doc.data();
      const userPhone = (uData.phone || uData.whatsappPhone || '').replace(/\D/g, '');

      // Comparación flexible de teléfono (coincidencia exacta o últimos 8-9 dígitos)
      const isMatch =
        (userPhone && (userPhone === cleanPhone || cleanPhone.endsWith(userPhone) || userPhone.endsWith(cleanPhone))) ||
        (uData.profiles &&
          uData.profiles.some((p: any) => {
            const pPhone = (p.phone || p.whatsappPhone || '').replace(/\D/g, '');
            return pPhone && (pPhone === cleanPhone || cleanPhone.endsWith(pPhone) || pPhone.endsWith(cleanPhone));
          }));

      if (isMatch) {
        matchedUser = uData;
        userId = doc.id;
        if (uData.profiles && uData.profiles.length > 0) {
          matchedProfile =
            uData.profiles.find((p: any) => {
              const pPhone = (p.phone || '').replace(/\D/g, '');
              return pPhone && (cleanPhone.endsWith(pPhone) || pPhone.endsWith(cleanPhone));
            }) || uData.profiles[0];
        }
        break;
      }
    }

    // Si el usuario no está registrado en Santisoft
    if (!matchedUser) {
      const notFoundMessage =
        `¡Hola ${pushName}! 👋\n\n` +
        `No encontramos una cuenta de Santisoft asociada a este número de teléfono (*${phone}*).\n\n` +
        `Para vincular tu cuenta:\n` +
        `1. Ingresa a tu panel en https://santisoft.cl\n` +
        `2. Ve a *Configuración / Perfil*\n` +
        `3. Añade este número en tu teléfono de contacto y guarda los cambios.\n\n` +
        `Una vez guardado, vuelve a escribirme para activar tu asistente. 🚀`;

      return NextResponse.json({
        success: true,
        replyText: notFoundMessage,
        isRegistered: false,
      });
    }

    const businessName = matchedProfile?.name || matchedUser?.displayName || 'Tu Negocio';
    const rubro = matchedProfile?.rubro || matchedUser?.rubro || 'General';
    const profileId = matchedProfile?.id || 'default';
    const userPlan = matchedUser?.plan || 'free';

    let replyText = '';

    // 2. Ejecutar la acción según el número elegido
    switch (action) {
      // ----------------------------------------------------
      // OPCIÓN 1: Ver próximos posts agendados
      // ----------------------------------------------------
      case '1': {
        const postsSnap = await adminDb
          .collection('social_posts')
          .where('userId', '==', userId)
          .where('status', 'in', ['confirmed', 'pending'])
          .orderBy('scheduledFor', 'asc')
          .limit(5)
          .get();

        if (postsSnap.empty) {
          replyText =
            `📅 *Próximos Posts de ${businessName}:*\n\n` +
            `No tienes publicaciones agendadas actualmente.\n\n` +
            `👉 *Escribe 4* para que nuestros agentes creen una nueva idea o planificación para ti.`;
        } else {
          let list = '';
          postsSnap.docs.forEach((doc, idx) => {
            const p = doc.data();
            const dateObj = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
            const dateFormatted = format(dateObj, "EEEE d 'de' MMMM, HH:mm", { locale: es });
            const typeEmoji = (p.type || '').toLowerCase().includes('reel') ? '🎬' : '🖼️';
            const statusTag = p.status === 'confirmed' ? '⏳ Agendado' : '⏸️ Borrador pendiente';
            list += `*${idx + 1}.* ${typeEmoji} *${p.type || 'Post'}* (${statusTag})\n` +
                    `📅 ${dateFormatted}\n` +
                    `📝 "${(p.idea || p.copy || '').slice(0, 100)}..."\n\n`;
          });

          replyText =
            `📅 *Próximas publicaciones para ${businessName}:*\n\n` +
            list +
            `_Escribe *6* si deseas confirmar los borradores pendientes, o *0* para volver al menú._`;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 2: Ver posts publicados
      // ----------------------------------------------------
      case '2': {
        const publishedSnap = await adminDb
          .collection('social_posts')
          .where('userId', '==', userId)
          .where('status', '==', 'published')
          .orderBy('publishedAt', 'desc')
          .limit(4)
          .get();

        if (publishedSnap.empty) {
          replyText =
            `📭 *Historial de ${businessName}:*\n\n` +
            `Aún no hay publicaciones enviadas automáticamente desde Santisoft.\n\n` +
            `_Escribe *1* para revisar lo que está agendado o *0* para el menú._`;
        } else {
          let list = '';
          publishedSnap.docs.forEach((doc, idx) => {
            const p = doc.data();
            const dateObj = p.publishedAt?.toDate ? p.publishedAt.toDate() : (p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date());
            const dateFormatted = format(dateObj, "d 'de' MMM, HH:mm", { locale: es });
            list += `*${idx + 1}.* ✅ *Publicado el ${dateFormatted}*\n` +
                    `📝 "${(p.idea || p.copy || p.postText || '').slice(0, 85)}..."\n\n`;
          });

          replyText =
            `✅ *Últimas publicaciones de ${businessName}:*\n\n` +
            list +
            `_Tus redes se están actualizando con regularidad. Escribe *0* para volver al menú._`;
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
          `\n👉 _Escribe *4* para convertir una de estas ideas en una publicación agendada._`;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 4: Crear nuevo post o planificar
      // ----------------------------------------------------
      case '4': {
        // Si el usuario envió una idea específica en el mensaje
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

        // Guardar como borrador en social_posts
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);

        const newPostRef = await adminDb.collection('social_posts').add({
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
          `👉 *Responde 6* para aprobar y agendar este post de inmediato en piloto automático.`;
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 5: Ver Cuota y Estadísticas
      // ----------------------------------------------------
      case '5': {
        const [usedPosts, maxPosts, maxVideos] = await Promise.all([
          getQuotaUsage(userId, profileId),
          getPlanLimit(userPlan, matchedUser?.email),
          getVideoPlanLimit(userPlan, matchedUser?.email),
        ]);

        const percentage = maxPosts > 0 && maxPosts < 99999 ? Math.round((usedPosts / maxPosts) * 100) : 0;
        const available = maxPosts >= 99999 ? 'Ilimitados' : Math.max(0, maxPosts - usedPosts);

        replyText =
          `📊 *Rendimiento y Cuota de ${businessName}*\n\n` +
          `💳 *Plan Actual:* ${userPlan.toUpperCase()}\n` +
          `📝 *Publicaciones Usadas este Mes:* ${usedPosts} de ${maxPosts >= 99999 ? '∞' : maxPosts} (${percentage}%)\n` +
          `✨ *Disponibles para el ciclo:* ${available}\n` +
          `🎬 *Límite de Reels/Videos:* ${maxVideos >= 99999 ? 'Ilimitados' : maxVideos}\n\n` +
          `_Tus agentes están operando de forma continua. Escribe *0* para ver el menú principal._`;
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

        if (pendingSnap.empty) {
          replyText =
            `👍 *Todo al día en ${businessName}:*\n\n` +
            `No tienes publicaciones pendientes de aprobación en este momento.\n\n` +
            `_Escribe *1* para revisar los posts que ya están agendados o *4* para crear uno nuevo._`;
        } else {
          let approvedCount = 0;
          for (const postDoc of pendingSnap.docs) {
            const p = postDoc.data();
            const dateObj = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(p.scheduledFor);

            // Programar tarea en GCP Tasks
            await enqueuePostTask(postDoc.id, dateObj);

            // Actualizar status a confirmed
            await postDoc.ref.update({
              status: 'confirmed',
              publishError: null,
            });
            approvedCount++;
          }

          replyText =
            `✅ *¡Excelente! Se han aprobado ${approvedCount} publicaciones.*\n\n` +
            `Nuestros agentes se encargarán de publicarlas en la fecha y hora indicadas sin que tengas que hacer nada más. 🚀\n\n` +
            `_Escribe *1* para ver tu calendario agendado._`;
        }
        break;
      }

      // ----------------------------------------------------
      // OPCIÓN 0 / DEFAULT: Menú Principal
      // ----------------------------------------------------
      default: {
        replyText =
          `👋 *¡Hola ${pushName}! Te damos la bienvenida a Santisoft.*\n` +
          `Gestionando: *${businessName}* (${rubro})\n\n` +
          `¿Qué necesitas gestionar hoy? Responde con un número:\n\n` +
          `1️⃣ *Próximos posts agendados*\n` +
          `2️⃣ *Posts ya publicados (historial)*\n` +
          `3️⃣ *Radar de nicho y tendencias*\n` +
          `4️⃣ *Crear nuevo post o idea*\n` +
          `5️⃣ *Ver cuota y estadísticas*\n` +
          `6️⃣ *Aprobar posts pendientes*\n\n` +
          `_Escribe el número de la opción que prefieras._`;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      replyText,
      businessName,
      userPlan,
      actionExecuted: action,
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
