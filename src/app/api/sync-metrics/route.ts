import { NextResponse } from 'next/server';
import { runMultiAgentSync } from '../../../lib/langgraph-sync';

export async function POST(req: Request) {
    try {
        const { userId, profileId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        console.log(`[SYNC API] Starting multi-agent sync for user ${userId}`);
        
        // Ejecutamos el orquestador de LangGraph
        const result = await runMultiAgentSync(userId, profileId || 'default');

        return NextResponse.json({ 
            success: true, 
            message: `Sincronización multi-agente finalizada.`,
            syncedCount: result.syncedCount,
            logs: result.logs,
            platforms: result.platforms
        });

    } catch (e: any) {
        console.error("Multi-agent Sync API failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
