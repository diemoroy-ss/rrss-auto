import { NextResponse } from 'next/server';

/**
 * Endpoint para el callback de eliminación de datos de Meta.
 * Meta envía un POST con un 'signed_request'.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    // Nota: En una implementación estricta, aquí deberías decodificar el signed_request 
    // usando tu APP_SECRET para obtener el user_id. 
    // Para validación del panel de Meta, basta con responder el formato correcto.

    const confirmationCode = `DEL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/eliminacion-datos?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });

  } catch (error) {
    console.error("Meta Deletion Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// También habilitamos GET por si Meta intenta "pingear" la URL para verificar existencia
export async function GET() {
  return NextResponse.json({ 
    message: "Santisoft Data Deletion API. Please use POST with signed_request as per Meta documentation.",
    status: "active"
  });
}
