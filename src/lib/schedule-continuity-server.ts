import { adminDb } from './firebase-admin';
import { getScheduleContinuityFromList, ScheduleContinuityResult } from './schedule-continuity';

/**
 * Consulta en servidor (Firebase Admin) la última fecha agendada de un usuario/perfil
 * filtrando en memoria para evitar requerir índices compuestos en Firestore.
 * Exclusivo para rutas de API y entornos Node.js.
 */
export async function getNextScheduleSlotServer({
  userId,
  profileId,
  targetHour = 18,
}: {
  userId: string;
  profileId?: string;
  targetHour?: number;
}): Promise<ScheduleContinuityResult> {
  if (!adminDb) {
    return getScheduleContinuityFromList([], profileId, targetHour);
  }

  try {
    const postsSnap = await adminDb
      .collection('social_posts')
      .where('userId', '==', userId)
      .limit(60)
      .get();

    const posts = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return getScheduleContinuityFromList(posts, profileId, targetHour);
  } catch (err) {
    console.warn('[SCHEDULE CONTINUITY SERVER] Error consultando posts previos:', err);
    return getScheduleContinuityFromList([], profileId, targetHour);
  }
}
