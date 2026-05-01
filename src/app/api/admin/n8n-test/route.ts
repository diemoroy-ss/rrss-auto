import { NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token' }, { status: 401 });
        }
        
        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
            // Optional: verify admin role here
        } catch (e) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const body = await req.json();
        const { webhookId } = body;
        
        if (!webhookId) {
            return NextResponse.json({ error: 'Falta webhookId' }, { status: 400 });
        }

        const CRON_SECRET = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';
        
        let url = '';
        let method = 'POST';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let payload: any = {};

        switch (webhookId) {
            case 'demo-ia':
                url = 'https://n8n.santisoft.cl/webhook-test/demo-ia';
                payload = {
                    business_type: 'TEST_BUSINESS',
                    objective: 'TEST_OBJ',
                    prompt: 'TEST_PROMPT',
                    tone: 'TEST_TONE',
                    date: new Date().toISOString()
                };
                break;
            case 'generar-imagen':
                url = process.env.N8N_IMAGE_GENERATOR_URL || 'https://n8n.santisoft.cl/webhook-test/generar-imagen';
                headers['Authorization'] = `Bearer ${CRON_SECRET}`;
                payload = {
                    callbackUrl: 'https://santisoft.cl/test-dummy-url',
                    id: 'TEST_POST_ID',
                    prompt: 'A cute robot building blocks',
                    user: decodedToken.uid,
                    model: 'dall-e-3',
                    size: '1024x1024'
                };
                break;
            case 'auto-rrss-ws':
                url = 'https://n8n.santisoft.cl/webhook-test/auto-rrss-ws';
                headers['X-Santisoft-Secret'] = CRON_SECRET;
                payload = {
                    event: 'report_delivery',
                    customerName: 'Admin Santisoft',
                    profileName: 'Perfil de Pruebas',
                    targetType: 'whatsapp',
                    targetValue: '56983656447',
                    message: 'Este es un mensaje de prueba desde el Dashboard Workflow N8N.',
                    filename: 'Test_Report.pdf',
                    pdfBase64: 'JVBERi0xLjEKJcKlwrHDqwoxIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoK' // Minimal PDF stub
                };
                break;
            case 'auto-rrss-email':
                url = 'https://n8n.santisoft.cl/webhook-test/auto-rrss-email';
                headers['X-Santisoft-Secret'] = CRON_SECRET;
                payload = {
                    event: 'report_delivery',
                    customerName: 'Admin Santisoft',
                    profileName: 'Perfil de Pruebas',
                    targetType: 'email',
                    targetValue: 'diemoroy@gmail.com',
                    message: 'Este es un mensaje de prueba vía Email desde el Dashboard Workflow N8N.',
                    filename: 'Test_Report.pdf',
                    pdfBase64: 'JVBERi0xLjEKJcKlwrHDqwoxIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoK' // Minimal PDF stub
                };
                break;
            case 'sincronizar-metricas':
                url = 'https://n8n.santisoft.cl/webhook-test/sincronizar-metricas';
                payload = {
                    userId: decodedToken.uid,
                    profileId: 'TEST_PROFILE',
                    facebookUrl: 'https://facebook.com/test',
                    instagramUrl: 'https://instagram.com/test'
                };
                break;
            case 'img-rrss-auto-test':
                url = 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
                payload = {
                    idea: 'Idea de prueba para preview',
                    businessType: 'Restaurante',
                    type: 'Post',
                    carouselCount: 1,
                    prompts: ['A delicious pizza on a wooden table']
                };
                break;
            case 'auto-rrss-post':
                url = 'https://n8n.santisoft.cl/webhook-test/auto-rrss-post';
                headers['X-Santisoft-Secret'] = CRON_SECRET;
                payload = {
                    postId: 'TEST_POST_ID',
                    userId: decodedToken.uid,
                    copy: 'Este es un post de prueba configurado desde el dash admin.',
                    networks: ['instagram']
                };
                break;
            default:
                return NextResponse.json({ error: 'Webhook desconocido' }, { status: 400 });
        }

        console.log(`[N8N TEST] Ejecutando: ${method} ${url}`);
        
        try {
            const start = Date.now();
            const fetchOptions: RequestInit = { method, headers };
            if (payload) fetchOptions.body = JSON.stringify(payload);
            
            const n8nResp = await fetch(url, fetchOptions);
            const duration = Date.now() - start;
            
            let dataOutput = null;
            let rawText = '';
            
            try {
                rawText = await n8nResp.text();
                // attempt to parse if json
                dataOutput = rawText ? JSON.parse(rawText) : null;
            } catch (e) {
                dataOutput = rawText; // Fallback to raw text if not JSON
            }

            return NextResponse.json({
                success: n8nResp.ok,
                status: n8nResp.status,
                statusText: n8nResp.statusText,
                durationMs: duration,
                url: url,
                data: dataOutput
            });
            
        } catch (fetchErr: any) {
             return NextResponse.json({
                success: false,
                error: fetchErr.message,
                status: 500,
                url: url
            }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
