import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, date, time, notes } = await req.json();

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // 1. Guardar en Base de Datos
    const bookingRef = await adminDb.collection("bookings").add({
      name,
      email,
      phone: phone || "",
      notes: notes || "",
      date,
      time,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    // 2. Enviar correos si SMTP está configurado
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
      });

      const fechaFormateada = new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      // Correo para el Cliente
      await transporter.sendMail({
        from: `"Santisoft Automatización" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `Confirmación de Demostración - Santisoft`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #DD4B19;">¡Hola ${name}! Tu demo está confirmada</h2>
            <p>Hemos agendado con éxito tu demostración de la plataforma Santisoft.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
              <p style="margin: 5px 0;"><strong>Fecha:</strong> ${fechaFormateada}</p>
              <p style="margin: 5px 0;"><strong>Hora:</strong> ${time}</p>
            </div>
            <p>Pronto te enviaremos el enlace para la videollamada.</p>
            <p>¡Nos vemos pronto!</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">El equipo de Santisoft AI</p>
          </div>
        `
      });

      // Correo para el Administrador
      const adminEmails = ["admin@santisoft.cl", "diemoroy@gmail.com"];
      await transporter.sendMail({
        from: `"Sistema de Reservas" <${process.env.SMTP_EMAIL}>`,
        to: adminEmails.join(', '),
        subject: `📅 Nueva Reserva de Demo: ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Nueva reunión agendada</h2>
            <ul>
              <li><strong>Nombre:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Teléfono:</strong> ${phone}</li>
              <li><strong>Fecha:</strong> ${date} (${time})</li>
              <li><strong>Notas:</strong> ${notes}</li>
            </ul>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true, bookingId: bookingRef.id });

  } catch (error: any) {
    console.error("Error agendando demo:", error);
    return NextResponse.json({ error: "Ocurrió un error al procesar la reserva" }, { status: 500 });
  }
}
