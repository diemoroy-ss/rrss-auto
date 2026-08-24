import { NextResponse } from 'next/server';
import { generateMultiNetworkCopiesWithAgent } from '../../../../../lib/agents/agent-copy';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idea, rubro, businessName, networks, visualDirection } = body;

    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return NextResponse.json({ error: 'Debes proporcionar una idea o tema.' }, { status: 400 });
    }

    const copies = await generateMultiNetworkCopiesWithAgent({
      idea: idea.trim(),
      targetProfile: {
        rubro: rubro || 'General',
        businessName: businessName || '',
      },
      networks: Array.isArray(networks) && networks.length > 0 ? networks : ['tiktok', 'instagram', 'youtube', 'facebook'],
      visualDirection: visualDirection || '',
    });

    return NextResponse.json({ success: true, copies });
  } catch (error: any) {
    console.error('Error generando copys por red social:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al generar los copys.' },
      { status: 500 }
    );
  }
}
