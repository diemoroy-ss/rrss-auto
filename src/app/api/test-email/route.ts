import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || process.env.SMTP_EMAIL || 'test@example.com';

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    const configStatus = {
        hasSmtpEmail: !!smtpEmail,
        smtpEmailMasked: smtpEmail ? smtpEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : null,
        hasSmtpPassword: !!smtpPassword,
        smtpPasswordLength: smtpPassword ? smtpPassword.length : 0,
        targetEmail: to
    };

    if (!smtpEmail || !smtpPassword) {
        return NextResponse.json({
            success: false,
            message: 'Faltan variables de entorno SMTP en el servidor.',
            configStatus
        }, { status: 400 });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpEmail,
                pass: smtpPassword
            }
        });

        // Verify connection configuration
        await transporter.verify();

        // Send test email
        const info = await transporter.sendMail({
            from: `"Santisoft Test" <${smtpEmail}>`,
            to: to,
            subject: '🧪 Prueba de Configuración de Correo - Santisoft',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">¡Diagnóstico de Correo Exitoso! 🎉</h2>
                    <p>Este es un correo de prueba enviado desde tu servidor para validar que la integración con Nodemailer y las credenciales SMTP están funcionando correctamente.</p>
                    <ul>
                        <li><strong>Servidor / Remitente:</strong> ${smtpEmail}</li>
                        <li><strong>Destinatario:</strong> ${to}</li>
                        <li><strong>Hora de prueba:</strong> ${new Date().toISOString()}</li>
                    </ul>
                    <p style="color: #10B981; font-weight: bold;">Todo está listo para enviar notificaciones automáticas al publicar posts.</p>
                </div>
            `
        });

        return NextResponse.json({
            success: true,
            message: 'Correo de prueba enviado exitosamente.',
            configStatus,
            smtpResponse: {
                messageId: info.messageId,
                response: info.response,
                accepted: info.accepted,
                rejected: info.rejected
            }
        });

    } catch (error: any) {
        console.error('[Test Email Error]:', error);
        return NextResponse.json({
            success: false,
            message: 'Error al intentar enviar el correo vía SMTP.',
            configStatus,
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                command: error.command,
                stack: error.stack
            }
        }, { status: 500 });
    }
}
