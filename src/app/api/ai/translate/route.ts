import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;
 
        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }
 
        const systemInstruction = `You are a professional translator. Translate the given Spanish text into English. The text will be used as a subject, object, or modifier inside an AI image generation prompt (e.g. Midjourney or DALL-E). Keep it concise, descriptive, and use appropriate artistic/photographic terminology if applicable. Return ONLY the English translation without any quotes, markdown, or extra explanations.`;

        const model = getFreeModel(undefined, systemInstruction);
        const result = await model.generateContent(text);
        const response = result.response;
        const translation = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

        return NextResponse.json({
            success: true,
            translation
        });

    } catch (error: any) {
        console.error("Error in translate API:", error);
        return NextResponse.json({ error: "Failed to translate.", details: error.message }, { status: 500 });
    }
}
