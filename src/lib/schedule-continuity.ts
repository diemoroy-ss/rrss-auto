import { adminDb } from './firebase-admin';

export interface ScheduleContinuityResult {
  hasFuturePosts: boolean;
  lastScheduledDate: Date | null;
  nextAvailableDate: Date;
  nextDateString: string; // Formato YYYY-MM-DD
}

/**
 * Convierte de forma segura cualquier formato de fecha de Firestore / JS a objeto Date.
 */
export function parseScheduledDate(rawDate: any): Date | null {
  if (!rawDate) return null;
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) return rawDate;
  if (typeof rawDate.toDate === 'function') {
    const d = rawDate.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (rawDate._seconds) {
    const d = new Date(rawDate._seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (rawDate.seconds) {
    const d = new Date(rawDate.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Función isomórfica para calcular la fecha de continuación en memoria
 * a partir de un arreglo de posts (utilizada tanto en cliente como en servidor).
 */
export function getScheduleContinuityFromList(
  posts: any[],
  profileId?: string,
  targetHour = 10
): ScheduleContinuityResult {
  const now = Date.now();
  const futureDates: Date[] = [];

  for (const p of posts || []) {
    // Si se especifica un profileId, filtrar posts de ese perfil (o default)
    if (profileId && p.profileId && p.profileId !== profileId) {
      continue;
    }

    // Solo considerar publicaciones válidas agendadas o pendientes
    const status = p.status || '';
    if (status !== 'confirmed' && status !== 'pending') {
      continue;
    }

    const dateObj = parseScheduledDate(p.scheduledFor);
    if (dateObj && dateObj.getTime() > now) {
      futureDates.push(dateObj);
    }
  }

  if (futureDates.length > 0) {
    const maxTs = Math.max(...futureDates.map((d) => d.getTime()));
    const lastDate = new Date(maxTs);

    // La nueva fecha arranca el día posterior al último post agendado
    const nextDate = new Date(maxTs);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(targetHour, 0, 0, 0);

    // Formato YYYY-MM-DD respetando zona horaria local
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');

    return {
      hasFuturePosts: true,
      lastScheduledDate: lastDate,
      nextAvailableDate: nextDate,
      nextDateString: `${y}-${m}-${day}`,
    };
  }

  // Si no hay posts futuros, sugerir mañana
  const defaultDate = new Date();
  if (defaultDate.getHours() >= 18) {
    defaultDate.setDate(defaultDate.getDate() + 1);
  }
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(targetHour, 0, 0, 0);

  const y = defaultDate.getFullYear();
  const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
  const day = String(defaultDate.getDate()).padStart(2, '0');

  return {
    hasFuturePosts: false,
    lastScheduledDate: null,
    nextAvailableDate: defaultDate,
    nextDateString: `${y}-${m}-${day}`,
  };
}

/**
 * Consulta en servidor (Firebase Admin) la última fecha agendada de un usuario/perfil
 * filtrando en memoria para evitar requerir índices compuestos en Firestore.
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
    console.warn('[SCHEDULE CONTINUITY] Error consultando posts previos:', err);
    return getScheduleContinuityFromList([], profileId, targetHour);
  }
}
