import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
    return NextResponse.json({ 
        message: "Endpoint update-image de Santisoft está ONLINE.",
        status: "Esperando POST con secret y postId"
    });
}

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
            updateData.imageUrls = [imageUrl]; // standardize
        }
        
        if (!error && (imageUrl || (imageUrls && imageUrls.length > 0))) {
            // Si la imagen se generó con éxito, generamos el copy automáticamente con Gemini
            try {
                const postData = postSnap.data();
                const idea = postData.idea || "Publicación promocional genérica";
                const textoVisual = postData.text || "No hay instrucciones visuales específicas.";
                
                const apiKey = process.env.GOOGLE_GENAI_API_KEY;
                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ 
                        model: "gemini-2.5-flash",
                        systemInstruction: `Eres un Community Manager Experto y Copywriter persuasivo. 
                        Tu misión es redactar el texto O "Pie de Foto" (copy) que acompañará a la imagen publicitaria en redes sociales (Facebook/Instagram).
                        
                        INSTRUCCIONES CLAVES:
                        - Toma la IDEA PRINCIPAL entregada y desarróllala en un texto súper atractivo, orientado a la acción y venta/engagement.
                        - Te entregaré también el "Texto Descriptivo / Visual". Úsalo solo como contexto de lo que se verá en la imagen, PERO NO repitas las instrucciones visuales, solo escribe el pie de foto.
                        - Usa emojis adecuados, viñetas si es necesario, y lenguaje cercano al cliente.
                        - Cierra SIEMPRE con un Llamado a la Acción (CTA) fuerte.
                        - NO MENCIONES LA IMAGEN en el texto de forma literal (nada de "En la imagen vemos...").
                        - NADA de comillas iniciales ni introducciones. Pasa directo al copy final.`
                    });

                    const prompt = `Idea Principal del Post: ${idea}\nContexto Visual de la Imagen: ${textoVisual}\n\nEscribe el Pie de Foto (Copy) Listo para Publicar:`;
                    const result = await model.generateContent(prompt);
                    const generatedText = await result.response.text();
                    
                    if (generatedText) {
                        updateData.copy = generatedText.trim(); 
                        // NOTA: NO sobreescribimos updateData.text, ya que ese guarda las instrucciones de la imagen.
                    }
                } else {
                    console.warn("No GOOGLE_GENAI_API_KEY config, skipping copy generation.");
                }
            } catch (aiError: any) {
                console.error("Copy AI Generation Error:", aiError);
                // Si falla la IA del copy, igual guardamos la imagen y no rompemos todo
            }
        }

        await updateDoc(postRef, updateData);

        return NextResponse.json({ success: true, postId });
        
    } catch (error: any) {
        console.error("Update Image Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
