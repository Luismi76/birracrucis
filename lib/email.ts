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

export async function sendWelcomeEmail(to: string, name: string) {
  const client = getResendClient();

  if (!client) {
    console.warn("Resend API key not configured - welcome email not sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `¡Bienvenido a Birracrucis, ${name}! 🍻`,
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
            <div style="background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">🍻</div>
              <h1 style="color: white; margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">¡Bienvenido!</h1>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">
                Hola ${name},
              </h2>
              <p style="color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                Gracias por unirte a <strong>Birracrucis</strong>, la aplicación definitiva para organizar tus rutas de bares con amigos.
              </p>

              <div style="background: #fffbeb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0 0 8px 0; font-weight: bold;">¿Qué puedes hacer ahora?</p>
                <ul style="color: #78350f; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                  <li>📍 Crear tu primera ruta de bares</li>
                  <li>👥 Invitar a tus amigos con un enlace</li>
                  <li>📸 Subir fotos y valorar los bares</li>
                  <li>💰 Controlar el bote común automáticamente</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <a href="${APP_URL}" style="display: block; background: #1e293b; color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px; transition: background 0.2s;">
                Empezar una Ruta
              </a>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                ¡Salud! 🍺<br>
                El equipo de Birracrucis
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error };
    }

    console.log("Welcome email sent:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

type SendRouteSummaryEmailParams = {
  to: string;
  userName: string;
  routeName: string;
  routeDate: Date;
  stopsVisited: number;
  totalStops: number;
};

export async function sendRouteSummaryEmail({
  to,
  userName,
  routeName,
  routeDate,
  stopsVisited,
  totalStops,
}: SendRouteSummaryEmailParams) {
  const formattedDate = routeDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const client = getResendClient();

  if (!client) {
    console.warn("Resend API key not configured - summary email not sent");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Resumen de ruta: ${routeName}`,
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
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">🏁</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Ruta Finalizada!</h1>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <p style="color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                Hola <strong style="color: #1e293b;">${userName}</strong>, gracias por participar.
                Aquí tienes el resumen de tu aventura cervecera:
              </p>

              <!-- Stats Card -->
              <div style="background: #ecfdf5; border: 2px solid #34d399; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #065f46; margin: 0 0 8px 0; font-size: 18px;">
                  ${routeName}
                </h3>
                <p style="color: #047857; margin: 0 0 16px 0; font-size: 14px;">
                  📅 ${formattedDate}
                </p>
                
                <div style="display: flex; gap: 12px; border-top: 1px solid #a7f3d0; padding-top: 12px;">
                   <div>
                      <div style="font-size: 24px; font-weight: bold; color: #059669;">${stopsVisited}</div>
                      <div style="font-size: 12px; color: #047857; text-transform: uppercase;">Bares Visitados</div>
                   </div>
                   <div style="border-left: 1px solid #a7f3d0; padding-left: 12px;">
                      <div style="font-size: 24px; font-weight: bold; color: #059669;">${totalStops}</div>
                      <div style="font-size: 12px; color: #047857; text-transform: uppercase;">Total Ruta</div>
                   </div>
                </div>
              </div>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
                ¡Esperamos verte en la próxima! 🍻
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                Birracrucis
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending summary email:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending summary email:", error);
    return { success: false, error };
  }
}
