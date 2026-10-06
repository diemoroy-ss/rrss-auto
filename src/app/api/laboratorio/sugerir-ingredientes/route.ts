import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { productName, rubro = "Gastronomía" } = await req.json();

    if (!productName || typeof productName !== "string") {
      return NextResponse.json(
        { error: "Se requiere el nombre del plato o producto." },
        { status: 400 }
      );
    }

    const prompt = `Eres un Chef Profesional y Planner Gastronómico especializado en cartas y publicidad de restaurantes.
Tu tarea es sugerir entre 3 y 5 ingredientes o atributos clave con sus proporciones/cantidades ideales para el plato "${productName}" (Rubro: ${rubro}).

REGLAS:
1. Devuelve exactamente entre 3 y 5 ingredientes reales o acompañamientos esenciales.
2. Cada ingrediente debe tener:
   - "icon": Un único emoji representativo (ej: 🧄, 🍝, 🫒, 🧀, 🌿, 🥩, 🍞, 🍅, 🥑, 🍔, 🍟, 🥤, 🍜, 🥚, 🧅).
   - "name": Nombre corto del ingrediente (máximo 15 caracteres).
   - "amount": Cantidad o proporción aproximada y realista (ej: "4 dientes", "200 g", "1 cda", "½ taza", "180 g", "al gusto").
3. DEVUELVE ÚNICAMENTE UN OBJETO JSON con la clave "ingredients". SIN BLOQUES DE CÓDIGO NI MARKDOWN.

Ejemplo:
{"ingredients":[{"icon":"🧄","name":"Ajo","amount":"4 dientes"},{"icon":"🍝","name":"Pasta","amount":"200 g"},{"icon":"🫒","name":"Aceite oliva","amount":"1 cda"},{"icon":"🧀","name":"Parmesano","amount":"½ taza"},{"icon":"🌿","name":"Perejil","amount":"al gusto"}]}`;

    const rawResponse = await generateFreeText(prompt, undefined, true);
    let parsed: any = null;

    try {
      // Limpiar posibles etiquetas markdown
      const cleanJson = rawResponse.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn("[Sugerir Ingredientes] Error parseando JSON, aplicando fallback:", parseErr);
    }

    let ingredients = Array.isArray(parsed?.ingredients) ? parsed.ingredients : [];

    // Fallback inteligente si la respuesta no vino en formato válido
    if (ingredients.length === 0) {
      const pLower = productName.toLowerCase();
      if (pLower.includes("burger") || pLower.includes("hamburguesa")) {
        ingredients = [
          { icon: "🥩", name: "Carne Angus", amount: "180 g" },
          { icon: "🍞", name: "Pan Brioche", amount: "Artesanal" },
          { icon: "🧀", name: "Queso Cheddar", amount: "2 láminas" },
          { icon: "🥓", name: "Tocino", amount: "Crujiente" },
          { icon: "🧅", name: "Cebolla", amount: "Caramelizada" },
        ];
      } else if (pLower.includes("pizza")) {
        ingredients = [
          { icon: "🌾", name: "Masa Madre", amount: "Fermentada 48h" },
          { icon: "🍅", name: "Salsa Pomodoro", amount: "Casera" },
          { icon: "🧀", name: "Mozzarella", amount: "Fior di latte" },
          { icon: "🌿", name: "Albahaca", amount: "Fresca" },
          { icon: "🫒", name: "Aceite Oliva", amount: "Extra virgen" },
        ];
      } else if (pLower.includes("ramen")) {
        ingredients = [
          { icon: "🍜", name: "Fideos Ramen", amount: "Frescos" },
          { icon: "🍲", name: "Caldo Shoyu", amount: "Cocción 12h" },
          { icon: "🥚", name: "Huevo Ajitama", amount: "Marinado" },
          { icon: "🥩", name: "Chashu", amount: "Cerdo tierno" },
          { icon: "🧅", name: "Cebollín", amount: "Fresco" },
        ];
      } else {
        ingredients = [
          { icon: "⭐", name: "Base Principal", amount: "Calidad premium" },
          { icon: "🌿", name: "Hierbas", amount: "Frescas" },
          { icon: "🧂", name: "Especias", amount: "De la casa" },
          { icon: "🔥", name: "Cocción", amount: "Al momento" },
        ];
      }
    }

    return NextResponse.json({
      success: true,
      productName,
      ingredients: ingredients.slice(0, 5),
    });
  } catch (err: any) {
    console.error("[Sugerir Ingredientes] Error:", err);
    return NextResponse.json(
      { error: err.message || "Error al sugerir ingredientes con los agentes." },
      { status: 500 }
    );
  }
}
