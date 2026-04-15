import { NextResponse } from 'next/server';

/**
 * Endpoint para enviar el reporte PDF y resumen a n8n.
 * Esto centraliza el envío por WhatsApp o Email mediante automatización externa.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            pdfBase64, 
            message, 
            customerName, 
            targetType, // 'whatsapp' | 'email'
            targetValue, // numero o email
            profileName 
        } = body;

        // Validación básica
        if (!pdfBase64 || !targetValue) {
            return NextResponse.json({ error: "Faltan datos obligatorios (PDF o Destino)" }, { status: 400 });
        }

        // Determinar la URL de n8n según el tipo de destino
        const N8N_WS_URL = "https://n8n.santisoft.cl/webhook-test/auto-rrss-ws";
        const N8N_EMAIL_URL = "https://n8n.santisoft.cl/webhook-test/auto-rrss-email";
        
        const webhookUrl = targetType === 'whatsapp' ? N8N_WS_URL : N8N_EMAIL_URL;
        const SECRET = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';

        console.log(`🚀 [SEND-REPORT] Enviando a n8n: ${webhookUrl}`);
        console.log(`📦 [SEND-REPORT] Destino: ${targetValue} (${targetType})`);

        // Enviar a n8n
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Santisoft-Secret': SECRET
            },
            body: JSON.stringify({
                event: 'report_delivery',
                customerName,
                profileName,
                targetType,
                targetValue,
                message,
                filename: `Reporte_${profileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                pdfBase64
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en n8n: ${errorText}`);
        }

        return NextResponse.json({ 
            success: true, 
            message: "Reporte enviado a la cola de automatización de n8n" 
        });

    } catch (error: any) {
        console.error("Error en send-report API:", error);
        return NextResponse.json({ 
            error: "Error interno al procesar el envío",
            details: error.message 
        }, { status: 500 });
    }
}
