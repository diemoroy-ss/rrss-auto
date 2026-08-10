import { NextResponse } from 'next/server';
import { generateVideoPoCComposition } from '../../../../lib/video-poc-service';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic, rubro, style } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Debes proporcionar un tema o idea para el video.' }, { status: 400 });
    }

    const composition = await generateVideoPoCComposition({
      topic: topic.trim(),
      rubro: rubro || 'General',
      style: style || 'vibrante',
    });

    return NextResponse.json({ success: true, composition });

  } catch (error: any) {
    console.error('Error en API PoC Video:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al generar la composición del video.' },
      { status: 500 }
    );
  }
}
