import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { enqueuePostTask, deletePostTask } from '../../../../lib/gcp-tasks';

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
        } catch (e) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const body = await req.json();
        const { postId, scheduledFor: scheduledForIso } = body;
        
        if (!postId || !scheduledForIso) {
            return NextResponse.json({ error: 'Falta postId o fecha' }, { status: 400 });
        }

        const scheduledDate = new Date(scheduledForIso);
        
        // Check if date is strictly in the future (plus a 30 sec buffer)
        // If it's in the past, Tasks returns an error. We want at least now + 30s.
        const now = new Date();
        const targetDate = scheduledDate < now ? new Date(now.getTime() + 30000) : scheduledDate;

        // Borrar tarea previa en GCP si existe
        const postRef = adminDb.collection('social_posts').doc(postId);
        const postSnap = await postRef.get();
        if (postSnap.exists) {
            const oldTaskName = postSnap.data()?.gcpTaskName;
            if (oldTaskName) {
                await deletePostTask(oldTaskName);
            }
        }

        const taskName = await enqueuePostTask(postId, targetDate);

        if (!taskName) {
             return NextResponse.json({ error: 'GCP Tasks config missing' }, { status: 500 });
        }

        // Guardar el identificador nativo de la tarea para posibles cancelaciones posteriores y limpiar errores anteriores
        await postRef.update({ gcpTaskName: taskName, publishError: null });

        return NextResponse.json({ success: true, taskName });

    } catch (error: any) {
        console.error("Error scheduling GCP Task:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
