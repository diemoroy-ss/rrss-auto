import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';

// Styles
const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 50,
        paddingHorizontal: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#6366f1',
    },
    headerLeft: {
        flexDirection: 'column',
    },
    brand: {
        fontSize: 10,
        color: '#6366f1',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    reportTitle: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        marginTop: 4,
    },
    reportSubtitle: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 2,
    },
    dateText: {
        fontSize: 9,
        color: '#94a3b8',
        textAlign: 'right',
    },
    // KPI Grid
    kpiGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    kpiLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'Helvetica-Bold',
    },
    kpiValue: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        marginTop: 4,
    },
    // Analysis section
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        marginBottom: 16,
        paddingBottom: 6,
        borderBottomWidth: 2,
        borderBottomColor: '#f1f5f9',
    },
    analysisBlock: {
        marginBottom: 14,
        paddingVertical: 5,
        backgroundColor: '#ffffff',
    },
    analysisText: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.6,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 8,
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
    },
    pageNumber: {
        fontSize: 8,
        color: '#94a3b8',
    },
    disclaimer: {
        marginTop: 16,
        padding: 10,
        backgroundColor: '#fffbeb',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    disclaimerText: {
        fontSize: 8,
        color: '#92400e',
        lineHeight: 1.5,
    },
});

// Parse the AI analysis text into sections for better rendering
function parseAnalysis(text: string): { heading?: string; content: string }[] {
    if (!text) return [];
    
    const sections: { heading?: string; content: string }[] = [];
    
    // Split by markdown-style headers (##, ###), HTML headers (<h3>), or numbered items
    const lines = text.split('\n');
    let currentSection: { heading?: string; lines: string[] } = { lines: [] };
    
    for (const line of lines) {
        let trimmed = line.trim();
        if (!trimmed) {
            if (currentSection.lines.length > 0) {
                sections.push({
                    heading: currentSection.heading,
                    content: currentSection.lines.join('\n').trim()
                });
                currentSection = { lines: [] };
            }
            continue;
        }
        
        // Check for HTML headings or Markdown headings
        const isHtmlHeading = /^<h[2-4]>.*?<\/h[2-4]>$/i.test(trimmed);
        const isMarkdownHeading = trimmed.startsWith('#');

        if (isHtmlHeading || isMarkdownHeading) {
            // New header found - push current and start new
            if (currentSection.lines.length > 0) {
                sections.push({
                    heading: currentSection.heading,
                    content: currentSection.lines.join('\n').trim()
                });
            }
            
            let headingText = trimmed;
            if (isHtmlHeading) {
                headingText = headingText.replace(/<[^>]+>/g, '').trim(); // strip html tags
            } else {
                headingText = headingText.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            }

            currentSection = {
                heading: headingText,
                lines: []
            };
        } else {
            // Clean markdown and HTML characters for cleaner PDF output
            
            // If it's an <li> tag, ensure it gets a bullet point
            if (/^<li.*?>/i.test(trimmed)) {
                trimmed = '• ' + trimmed;
            }
            
            // Skip structural empty tags
            if (/^<\/?(ul|ol|div|span|p|br)>/i.test(trimmed) && trimmed.replace(/<[^>]+>/g, '').trim() === '') {
                continue; // It's just a structural tag like <ul> on its own line
            }

            currentSection.lines.push(
                trimmed
                    .replace(/<br\s*\/?>/gi, '\n') // turn <br> into newlines
                    .replace(/<[^>]+>/g, '')         // strip all remaining HTML tags (strong, b, p, etc)
                    .replace(/\*\*(.*?)\*\*/g, '$1') // remove markdown bold
                    .replace(/\*(.*?)\*/g, '$1')     // remove markdown italic
                    .replace(/^[-*]\s+/, '• ')       // markdown list markers
            );
        }
    }

    // Push the last section
    if (currentSection.lines.length > 0) {
        sections.push({
            heading: currentSection.heading,
            content: currentSection.lines.join('\n').trim()
        });
    }

    return sections.filter(s => s.content.length > 0 || s.heading);
}

interface Props {
    profileName: string;
    totalReach: number;
    totalInteractions: number;
    aiAnalysis: string;
    generatedAt: string;
}

export function ReporteAnalyticsPDF({ profileName, totalReach, totalInteractions, aiAnalysis, generatedAt }: Props) {
    const sections = parseAnalysis(aiAnalysis);
    
    return (
        <Document
            title={`Reporte RRSS - ${profileName}`}
            author="Santisoft IA"
            subject="Reporte de Analítica de Redes Sociales"
        >
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.brand}>Santisoft · Inteligencia de Marca</Text>
                        <Text style={styles.reportTitle}>{profileName}</Text>
                        <Text style={styles.reportSubtitle}>Reporte Analítico de Redes Sociales</Text>
                    </View>
                    <Text style={styles.dateText}>{generatedAt}</Text>
                </View>

                {/* KPI Cards */}
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Alcance Total</Text>
                        <Text style={styles.kpiValue}>{totalReach.toLocaleString('es-ES')}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Interacciones Totales</Text>
                        <Text style={styles.kpiValue}>{totalInteractions.toLocaleString('es-ES')}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Tasa de Interacción</Text>
                        <Text style={styles.kpiValue}>
                            {totalReach > 0 ? ((totalInteractions / totalReach) * 100).toFixed(1) + '%' : 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* AI Analysis */}
                <Text style={styles.sectionTitle}>Análisis Generado por IA</Text>

                {sections.length > 0 ? (
                    sections.map((section, i) => (
                        <View key={i} style={styles.analysisBlock} wrap={false}>
                            {section.heading && (
                                <Text style={[styles.analysisText, { fontFamily: 'Helvetica-Bold', marginBottom: 5, color: '#4f46e5' }]}>
                                    {section.heading}
                                </Text>
                            )}
                            <Text style={styles.analysisText}>{section.content}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.analysisBlock}>
                        <Text style={styles.analysisText}>{aiAnalysis}</Text>
                    </View>
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        ⚡ Este reporte fue generado automáticamente por Santisoft IA. Los datos de rendimiento provienen de la sincronización con Meta Business Suite. 
                        Las conclusiones son orientativas y deben complementarse con el criterio profesional del equipo de marketing.
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Santisoft · Potenciado por Gemini AI</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
}
