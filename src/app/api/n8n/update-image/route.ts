import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getVertexModel } from "../../../lib/vertexai";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { secret, postId, imageUrl, imageUrls, error } = body;

        const cronSecret = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';
        if (secret !== cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!postId) {
            return NextResponse.json({ error: "postId is required" }, { status: 400 });
        }

        const postRef = doc(db, "social_posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
             return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const updateData: any = { isGeneratingImage: false };
        let targetImageUrl = imageUrl;
        
        if (error) {
            updateData.errorLog = `Image Gen Error: ${error}`;
        } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            updateData.imageUrls = imageUrls;
            updateData.imageUrl = imageUrls[0];
            targetImageUrl = imageUrls[0];
        } else if (imageUrl) {
            updateData.imageUrl = imageUrl;
            updateData.imageUrls = [imageUrl]; 
        }
        
        if (!error && (imageUrl || (imageUrls && imageUrls.length > 0))) {
            try {
                const postData = postSnap.data();
                const idea = postData.idea || "Publicación promocional genérica";
                const textoVisual = postData.text || "No hay instrucciones visuales específicas.";
                
                const systemInstruction = `Eres un Community Manager Experto y Copywriter persuasivo. 
                Tu misión es redactar el texto O "Pie de Foto" (copy) que acompañará a la imagen publicitaria en redes sociales (Facebook/Instagram).
                
                INSTRUCCIONES CLAVES:
                - Toma la IDEA PRINCIPAL entregada y desarróllala en un texto súper atractivo, orientado a la acción y venta/engagement.
                - Te entregaré también el "Texto Descriptivo / Visual". Úsalo solo como contexto de lo que se verá en la imagen, PERO NO repitas las instrucciones visuales, solo escribe el pie de foto.
                - Usa emojis adecuados, viñetas si es necesario, y lenguaje cercano al cliente.
                - Cierra SIEMPRE con un Llamado a la Acción (CTA) fuerte.
                - NO MENCIONES LA IMAGEN en el texto de forma literal.
                - NADA de comillas iniciales ni introducciones.`;

                const model = getVertexModel("gemini-2.5-flash", systemInstruction);

                const prompt = `Idea Principal del Post: ${idea}\nContexto Visual de la Imagen: ${textoVisual}\n\nEscribe el Pie de Foto (Copy) Listo para Publicar:`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                
                if (generatedText) {
                    updateData.copy = generatedText; 
                }
            } catch (aiError: any) {
                console.error("Copy Generation Error (Vertex AI):", aiError);
            }
        }

        await updateDoc(postRef, updateData);
        return NextResponse.json({ success: true, postId });
        
    } catch (error: any) {
        console.error("Update Image Error (Vertex):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
