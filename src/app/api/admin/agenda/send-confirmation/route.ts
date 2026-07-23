import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, email, name, date, time, meetUrl, customMessage } = await req.json();

    if (!bookingId || !email) {
      return NextResponse.json({ error: "Booking ID and email are required" }, { status: 400 });
    }

    // 1. Actualizar estado a "confirmed" en Firestore
    await adminDb.collection("bookings").doc(bookingId).update({
      status: "confirmed",
      meetUrl: meetUrl || "",
      confirmedAt: new Date().toISOString()
    });

    // 2. Enviar correo de confirmación con el link de Google Meet
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
      });

      const fechaFormateada = new Date(date + "T00:00:00").toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const meetButtonHtml = meetUrl 
        ? `<div style="margin: 25px 0; text-align: center;">
            <a href="${meetUrl}" target="_blank" style="background-color: #DD4B19; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(221,75,25,0.3);">
              🎥 Unirse a la Videollamada (Google Meet)
            </a>
           </div>`
        : '';

      await transporter.sendMail({
        from: `"Santisoft AI" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `✅ Confirmación de Demostración - Santisoft AI`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #eaeaea;">
            <div style="background-color: #1e293b; padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Demostración Confirmada</h1>
              <p style="margin-top: 5px; opacity: 0.8; font-size: 14px;">Santisoft AI Automatización</p>
            </div>
            
            <div style="padding: 30px;">
              <p>Hola <strong>${name || 'cliente'}</strong>,</p>
              <p>Tu reunión para la demostración de nuestra plataforma ha sido <strong>confirmada oficialmente</strong>.</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #DD4B19;">
                <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
                <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> ${time} hrs</p>
                ${meetUrl ? `<p style="margin: 5px 0;"><strong>🔗 Enlace:</strong> <a href="${meetUrl}" style="color: #DD4B19;">${meetUrl}</a></p>` : ''}
              </div>

              ${customMessage ? `
                <div style="background-color: #fffbe6; padding: 15px; border-radius: 8px; border: 1px solid #ffe58f; margin-bottom: 20px; font-size: 14px;">
                  <strong>Mensaje del equipo:</strong><br />${customMessage}
                </div>
              ` : ''}

              ${meetButtonHtml}

              <p style="font-size: 13px; color: #64748b; margin-top: 25px;">
                Te sugerimos conectarte 5 minutos antes. Si necesitas reprogramar, responde a este correo.
              </p>
            </div>

            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
              © 2026 Santisoft.cl — Automatización Inteligente de Redes Sociales
            </div>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
