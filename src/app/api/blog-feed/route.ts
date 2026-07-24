import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

// Helper: resolve userId from apiKey stored in users collection
async function resolveUserId(apiKey: string): Promise<string | null> {
  try {
    const snap = await adminDb
      .collection('users')
      .where('seoApiKeys', 'array-contains', apiKey)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].id;
  } catch {
    return null;
  }
}

function mapPost(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: data.title || '',
    slug: data.slug || id,
    excerpt: data.metaDescription || (data.content || '').replace(/[#*`_\-\n]/g, ' ').substring(0, 200),
    htmlContent: data.htmlContent || data.content || '',
    markdownContent: data.content || '',
    imageUrl: data.imageUrl || data.imagen_url || null,
    seoTitle: data.seoTitle || data.title || '',
    metaDescription: data.metaDescription || '',
    keywords: data.keywords || data.palabras_clave || [],
    schema: buildSchema(data),
    publishedAt: data.publishedAt || data.createdAt || new Date().toISOString(),
    lang: 'es',
  };
}

function buildSchema(data: FirebaseFirestore.DocumentData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title || '',
    description: data.metaDescription || '',
    image: data.imageUrl || null,
    datePublished: data.publishedAt || data.createdAt || new Date().toISOString(),
    author: { '@type': 'Organization', name: 'Santisoft AI' },
    keywords: (data.keywords || []).join(', '),
  };
}

export async function GET(req: Request) {
  // CORS headers — allow any origin (public read-only API)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'x-api-key, Authorization, Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  try {
    // --- Auth: resolve API Key from header or query param ---
    const url = new URL(req.url);
    const apiKey =
      req.headers.get('x-api-key') ||
      url.searchParams.get('apiKey') ||
      url.searchParams.get('api_key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Se requiere una API Key. Pásala en el header x-api-key o en el parámetro ?apiKey=' },
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = await resolveUserId(apiKey);
    if (!userId) {
      return NextResponse.json(
        { error: 'API Key inválida o revocada.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Actualizar última fecha de uso para mostrar estado OK en la UI
    adminDb.collection('users').doc(userId).update({
      seoApiKeyLastUsed: new Date().toISOString()
    }).catch(() => {});

    const slug = url.searchParams.get('slug');
    const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);

    // --- Single post by slug ---
    if (slug) {
      const snap = await adminDb
        .collection('blog_posts')
        .where('userId', '==', userId)
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();

      if (snap.empty) {
        return NextResponse.json(
          { error: 'Artículo no encontrado o no publicado.' },
          { status: 404, headers: corsHeaders }
        );
      }

      const docSnap = snap.docs[0];
      return NextResponse.json(
        { post: mapPost(docSnap.id, docSnap.data()) },
        { headers: corsHeaders }
      );
    }

    // --- List published posts ---
    const snap = await adminDb
      .collection('blog_posts')
      .where('userId', '==', userId)
      .where('status', '==', 'published')
      .limit(Math.min(limitParam, 100))
      .get();

    const posts = snap.docs
      .map((d) => mapPost(d.id, d.data()))
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    return NextResponse.json(
      {
        posts,
        total: posts.length,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('[blog-feed] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor', detail: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
