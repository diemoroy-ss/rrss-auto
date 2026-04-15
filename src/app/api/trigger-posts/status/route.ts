import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// N8N calls this after attempting to publish
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { secret, postId, status, errorMessage } = body;

        const cronSecret = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';
        if (secret !== cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!postId || !['published', 'error'].includes(status)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const updateData: any = { status };
        if (errorMessage) {
            updateData.errorLog = errorMessage;
        }

        await updateDoc(doc(db, "social_posts", postId), updateData);

        return NextResponse.json({ success: true, postId, status });
        
    } catch (error: any) {
        console.error("Status Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
