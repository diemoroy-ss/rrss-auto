import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret') || req.headers.get('x-admin-secret');
        const expectedSecret = process.env.ADMIN_CRON_SECRET || process.env.CRON_SECRET;

        // Requiere clave secreta estricta configurada en .env
        if (!expectedSecret || secret !== expectedSecret) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const collectionsToMigrate = ['social_posts', 'external_posts', 'strategy'];
        let totalMigrated = 0;

        for (const colName of collectionsToMigrate) {
            const snapshot = await adminDb.collection(colName).get();
            
            const batchSize = 400;
            let count = 0;
            let batch = adminDb.batch();

            for (const doc of snapshot.docs) {
                const data = doc.data();
                // Si no tiene profileId, le asignamos permanentemente 'default'
                if (!data.profileId) {
                    batch.update(doc.ref, { profileId: 'default' });
                    count++;
                    totalMigrated++;

                    if (count === batchSize) {
                        await batch.commit();
                        batch = adminDb.batch();
                        count = 0;
                    }
                }
            }

            // Commit remanentes
            if (count > 0) {
                await batch.commit();
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Migración V2 ejecutada con éxito. Se actualizaron ${totalMigrated} documentos inyectándoles profileId: 'default'.` 
        });

    } catch (error: any) {
        console.error('Error durante la migración:', error);
        return NextResponse.json({ error: 'Error del servidor durante migración' }, { status: 500 });
    }
}
