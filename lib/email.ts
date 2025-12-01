import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "Birracrucis <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://birracrucis.vercel.app";

// Resend client - solo se inicializa si hay API key
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

type SendInvitationEmailParams = {
  to: string;
  inviterName: string;
  routeName: string;
  routeDate: Date;
  message?: string | null;
  routeId: string;
};

export async function sendInvitationEmail({
  to,
  inviterName,
  routeName,
  routeDate,
  message,
  routeId,
}: SendInvitationEmailParams) {
  const formattedDate = routeDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const routeUrl = `${APP_URL}/routes/${routeId}`;
  const invitationsUrl = `${APP_URL}/routes`;

  const client = getResendClient();

  if (!client) {
    console.warn("Resend API key not configured - email not sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${inviterName} te ha invitado a un Birracrucis!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">🍺</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">Birracrucis</h1>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">
                Te han invitado!
              </h2>

              <p style="color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                <strong style="color: #1e293b;">${inviterName}</strong> te ha invitado a unirte a la ruta:
              </p>

              <!-- Route Card -->
              <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 18px;">
                  ${routeName}
                </h3>
                <p style="color: #a16207; margin: 0; font-size: 14px;">
                  📅 ${formattedDate}
                </p>
              </div>

              ${message ? `
              <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #64748b; margin: 0; font-size: 14px; font-style: italic;">
                  "${message}"
                </p>
              </div>
              ` : ""}

              <!-- CTA Button -->
              <a href="${invitationsUrl}" style="display: block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px;">
                Ver invitacion
              </a>

              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
                Si no esperabas este email, puedes ignorarlo.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                Birracrucis - La app para organizar rutas de birras
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending invitation email:", error);
      return { success: false, error };
    }

    console.log("Invitation email sent:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return { success: false, error };
  }
}
