import nodemailer from 'nodemailer';

interface SendFidelizaWelcomeEmailParams {
  toEmail: string;
  memberName: string;
  businessName: string;
  programName: string;
  cardUrl: string;
  targetGoal: number;
  rewardTitle: string;
  mode: "visits" | "points" | "amount";
  welcomeBonus: boolean;
}

export async function sendFidelizaWelcomeEmail({
  toEmail,
  memberName,
  businessName,
  programName,
  cardUrl,
  targetGoal,
  rewardTitle,
  mode,
  welcomeBonus,
}: SendFidelizaWelcomeEmailParams): Promise<boolean> {
  try {
    const SMTP_EMAIL = process.env.SMTP_EMAIL;
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

    if (!SMTP_EMAIL || !SMTP_PASSWORD || !toEmail || !toEmail.includes("@")) {
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"${businessName} (Fideliza)" <${SMTP_EMAIL}>`,
      to: toEmail,
      subject: `🎉 ¡Bienvenido/a a ${programName} de ${businessName}! Tu tarjeta digital está lista`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 42px;">⭐</span>
            <h1 style="color: #0f172a; font-size: 24px; margin-top: 10px; font-weight: 800; letter-spacing: -0.5px;">¡Hola, ${memberName}!</h1>
            <p style="color: #64748b; font-size: 15px; margin: 6px 0 0 0;">Tu tarjeta de fidelización ya está activa en <strong>${businessName}</strong></p>
          </div>

          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 24px; border-radius: 16px; color: #ffffff; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.3);">
            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; font-weight: 700;">${programName}</div>
            <div style="font-size: 22px; font-weight: 900; margin: 8px 0;">${businessName}</div>
            ${welcomeBonus ? `<div style="display: inline-block; background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; margin-top: 4px;">✨ ¡1er sello de bienvenida acreditado!</div>` : ""}
            <div style="margin-top: 14px; font-size: 14px; opacity: 0.95;">
              Meta: <strong>${targetGoal} ${mode === "visits" ? "visitas" : "puntos"}</strong> para canjear <strong>${rewardTitle}</strong>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="${cardUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 800; border-radius: 12px; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
              📲 Ver Mi Tarjeta Digital
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            Guarda este correo o agrega la tarjeta a tus favoritos del navegador para ver tus sellos y canjear premios cada vez que visites el local.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
          <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin-top: 12px;">
            Powered by Fideliza &bull; Santisoft
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.warn("[FIDELIZA EMAIL] Error sending welcome email:", err);
    return false;
  }
}
