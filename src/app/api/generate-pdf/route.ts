import { NextResponse } from 'next/server';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import { createElement } from 'react';
import { ReporteAnalyticsPDF } from '../../../components/ReporteAnalyticsPDF';

export async function POST(req: Request) {
    try {
        const { profileName, totalReach, totalInteractions, aiAnalysis, generatedAt } = await req.json();

        if (!aiAnalysis) {
            return NextResponse.json({ error: 'Falta el análisis AI (aiAnalysis)' }, { status: 400 });
        }

        // Render the PDF on the server using react-pdf
        const buffer = await renderToBuffer(
            createElement(ReporteAnalyticsPDF, {
                profileName: profileName || 'Mi Marca',
                totalReach: totalReach || 0,
                totalInteractions: totalInteractions || 0,
                aiAnalysis,
                generatedAt: generatedAt || new Date().toLocaleDateString('es-CL'),
            }) as any
        );

        // Return as base64-encoded JSON for easy consumption by the client
        const base64 = buffer.toString('base64');

        return NextResponse.json({ pdfBase64: base64 });

    } catch (error: any) {
        console.error('[generate-pdf] Error:', error);
        return NextResponse.json({ error: 'Error generando PDF', details: error.message }, { status: 500 });
    }
}
