import { adminDb } from "./firebase-admin";
import { ChatMessageItem } from "./gemini";

export async function getChatHistory(phone: string, maxMessages = 15): Promise<ChatMessageItem[]> {
    if (!adminDb) {
        console.warn("adminDb no inicializado. Se retorna historial vacío.");
        return [];
    }
    
    try {
        // Obtenemos los últimos N mensajes, ordenados por fecha descendente
        const snapshot = await adminDb.collection("whatsapp_chats")
            .doc(phone)
            .collection("messages")
            .orderBy("createdAt", "desc")
            .limit(maxMessages)
            .get();
            
        const messages: ChatMessageItem[] = [];
        // Al estar descendente, el más reciente está primero. 
        // Hacemos unshift para que queden en orden cronológico (el más antiguo primero) para la IA.
        snapshot.forEach(doc => {
           const data = doc.data();
           messages.unshift({
               role: data.role as "user" | "ai",
               text: data.text || ""
           });
        });
        
        return messages;
    } catch (error: any) {
     console.error("Error obteniendo historial de chat:", error.message || error);
     throw new Error(`Failed to retrieve chat history: ${error.message || 'Unknown error'}`);
  }
}

export async function saveChatMessage(phone: string, role: "user" | "ai", text: string, pushName?: string) {
    if (!adminDb) {
        console.warn("adminDb no inicializado. No se guardó el mensaje.");
        return;
    }
    
    try {
        const timestamp = new Date();

        // Actualizamos el documento principal para tener el listado de chats activos y el nombre
        const updateData: any = { updatedAt: timestamp };
        if (pushName && role === "user") {
            updateData.lastPushName = pushName;
        }

        await adminDb.collection("whatsapp_chats").doc(phone).set(updateData, { merge: true });

        // Guardamos el mensaje en la subcolección
        await adminDb.collection("whatsapp_chats")
            .doc(phone)
            .collection("messages")
            .add({
                role,
                text,
                createdAt: timestamp
            });

    } catch (error) {
        console.error("Error guardando mensaje de chat (saveChatMessage):", error);
        throw error; // Rethrow to let the caller know it failed
    }
}
