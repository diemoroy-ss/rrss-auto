import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return new Response('Missing url parameter', { status: 400 });
        }

        // Security check: Only allow Firebase Storage URLs to prevent SSRF abuse
        if (!targetUrl.startsWith('https://firebasestorage.googleapis.com/v0/b/')) {
            return new Response('Unauthorized target URL', { status: 403 });
        }

        // Fetch the file from Firebase Storage
        const fileRes = await fetch(targetUrl);
        if (!fileRes.ok) {
            return new Response('Failed to fetch resource from storage', { status: fileRes.status });
        }

        const contentType = fileRes.headers.get('content-type') || 'video/mp4';
        const contentLength = fileRes.headers.get('content-length');

        // Forward headers and binary stream
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }
        
        // Cache the file for 1 hour to reduce bandwidth and redundant fetch requests
        headers.set('Cache-Control', 'public, max-age=3600');

        return new Response(fileRes.body, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error('[Video Proxy Error]:', error);
        return new Response(error.message || 'Internal Server Error', { status: 500 });
    }
}
