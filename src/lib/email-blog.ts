import nodemailer from 'nodemailer';

interface SendPublishedEmailParams {
    toEmail: string;
    postTitle: string;
    postUrl?: string;
    publishedAt: string;
}

export async function sendPublishedBlogEmail({ toEmail, postTitle, postUrl, publishedAt }: SendPublishedEmailParams) {
    try {
        const SMTP_EMAIL = process.env.SMTP_EMAIL;
        const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

        if (!SMTP_EMAIL || !SMTP_PASSWORD) {
            console.warn("[EMAIL-BLOG] SMTP credentials not configured. Skipping email notification.");
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: SMTP_EMAIL,
                pass: SMTP_PASSWORD
            }
        });

        const targetUrl = postUrl || 'https://santisoft.cl/blog';

        const mailOptions = {
            from: `"Santisoft Autopilot SEO" <${SMTP_EMAIL}>`,
            to: toEmail,
            subject: `🎉 Tu artículo "${postTitle}" ha sido publicado`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px;">🚀</span>
                        <h2 style="color: #0f172a; font-size: 22px; margin-top: 8px; font-weight: 800;">¡Nuevo Artículo Publicado!</h2>
                    </div>

                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola, te notificamos que el piloto automático SEO ha redactado, revisado y publicado exitosamente tu artículo de blog:
                    </p>

                    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 8px;">
                        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 17px;">${postTitle}</h3>
                        <p style="margin: 0; color: #64748b; font-size: 13px;">Fecha de publicación: ${publishedAt}</p>
                    </div>

                    <div style="text-align: center; margin-top: 28px; margin-bottom: 20px;">
                        <a href="${targetUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 700; border-radius: 10px; display: inline-block; font-size: 14px;">
                            🌐 Ver Artículo en la Web
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
                    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
                        Santisoft AI — Automatización Inteligente de Contenidos & SEO
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL-BLOG] Notification email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("[EMAIL-BLOG] Error sending notification email:", error);
        return false;
    }
}
