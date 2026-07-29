import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { promptTemplates } from "../../../../data/promptLibrary";

export async function GET() {
    try {
        if (!adminDb) return NextResponse.json({ error: "No admin DB" }, { status: 500 });
        const colRef = adminDb.collection("prompt_library");
        const existing = await colRef.get();
        
        if (!existing.empty) {
            return NextResponse.json({ message: "Already seeded", count: existing.size });
        }

        let count = 0;
        for (const pt of promptTemplates) {
            await colRef.add({
                title: pt.title,
                description: pt.description,
                category: pt.category,
                prompt: pt.prompt,
                previewUrl: pt.previewUrl,
                imageRequirement: pt.imageRequirement,
                variables: pt.variables || [],
                createdAt: new Date()
            });
            count++;
        }

        return NextResponse.json({ message: "Successfully seeded prompts", count });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
