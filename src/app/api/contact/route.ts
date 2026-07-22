import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nombre, email, telefono, mensaje, rubro } = body;

        if (!nombre || !email || !mensaje) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        // 1. Save to Firebase as Backup
        if (adminDb) {
            await adminDb.collection('contact_messages').add({
                nombre,
                email,
                telefono: telefono || "",
                mensaje,
                rubro: rubro || "",
                createdAt: new Date(),
                status: 'unread'
            });
        }

        // 2. Send Email via Nodemailer
        const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;
        
        if (!SMTP_EMAIL || !SMTP_PASSWORD) {
            console.warn("SMTP credentials not configured. Message saved to Firebase only.");
            // Returning success since we at least saved it to the DB
            return NextResponse.json({ success: true, warning: "SMTP_NOT_CONFIGURED" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: SMTP_EMAIL,
                pass: SMTP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"Santisoft Contacto" <${SMTP_EMAIL}>`,
            to: 'santisofttai@gmail.com', // Correo destino solicitado
            replyTo: email,
            subject: `Nuevo mensaje de contacto de ${nombre}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #4f46e5;">Nuevo Contacto - Santisoft AI</h2>
                    <p>Has recibido un nuevo mensaje desde el formulario de contacto de tu Landing Page.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 120px;">Nombre:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${nombre}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Email:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Teléfono:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${telefono || 'No especificado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Rubro/Empresa:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${rubro || 'No especificado'}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px;">
                        <p style="margin: 0; font-weight: bold; margin-bottom: 10px;">Mensaje:</p>
                        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${mensaje}</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in contact route:", error);
        return NextResponse.json({ error: error.message || "Error processing contact request" }, { status: 500 });
    }
}
