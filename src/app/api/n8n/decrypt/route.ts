import { NextResponse } from 'next/server';
import { decrypt } from '../../../../lib/encryption';

export async function POST(req: Request) {
    try {
        // En n8n se debe enviar el header Authorization: Bearer mi-secreto-n8n
        const authHeader = req.headers.get('authorization');
        const expectedSecret = process.env.N8N_SECRET_TOKEN || 'santisoft-n8n-secure-key-2026';
        
        if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const body = await req.json();
        let { encryptedData, iv, authTag } = body;

        // Auto-fix for n8n/Firestore format: { stringValue: '...' }
        if (typeof encryptedData === 'object' && encryptedData?.stringValue) encryptedData = encryptedData.stringValue;
        if (typeof iv === 'object' && iv?.stringValue) iv = iv.stringValue;
        if (typeof authTag === 'object' && authTag?.stringValue) authTag = authTag.stringValue;

        if (!encryptedData || !iv || !authTag) {
            return NextResponse.json({ error: "Missing encryption data" }, { status: 400 });
        }

        const token = decrypt(encryptedData, iv, authTag);

        return NextResponse.json({ success: true, token });

    } catch (error: any) {
        console.error("Error decrypting token for n8n:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
