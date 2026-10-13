import { NextResponse } from 'next/server';
import { runMultiAgentSync } from '../../../lib/langgraph-sync';
import { adminAuth } from '../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        let { userId, profileId } = body;

        // Si viene token Bearer en headers, extraer o validar UID
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ') && adminAuth) {
            try {
                const token = authHeader.split('Bearer ')[1];
                const decoded = await adminAuth.verifyIdToken(token);
                if (decoded?.uid) {
                    userId = decoded.uid;
                }
            } catch (authErr) {
                console.warn('[SYNC API] Advertencia verificando token Bearer:', authErr);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "userId es requerido para sincronizar métricas" }, { status: 400 });
        }

        console.log(`[SYNC API] Iniciando sincronización de agentes para usuario ${userId}, perfil: ${profileId || 'default'}`);

        // Ejecutar orquestador multi-agente
        const result = await runMultiAgentSync(userId, profileId || 'default');

        const message = result.platforms && result.platforms.length > 0
            ? `Sincronización de agentes completada: ${result.syncedCount} publicaciones actualizadas en tus redes.`
            : `Sincronización finalizada. No se detectaron redes sociales vinculadas activas en este perfil.`;

        return NextResponse.json({ 
            success: true, 
            message,
            syncedCount: result.syncedCount,
            logs: result.logs,
            platforms: result.platforms
        });

    } catch (e: any) {
        console.error("Multi-agent Sync API falló:", e);
        return NextResponse.json({ 
            error: e.message || 'Error en el servidor al sincronizar con tus redes sociales' 
        }, { status: 500 });
    }
}
