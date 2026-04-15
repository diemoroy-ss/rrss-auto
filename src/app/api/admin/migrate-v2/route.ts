import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function GET(req: Request) {
    try {
        // En producción idealmente validamos con un token de admin o header secreto,
        // pero como es un script de migración que usaremos una sola vez lo ejecutaremos directo
        // *Advertencia: Siempre desactivar post-migración*
        
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
