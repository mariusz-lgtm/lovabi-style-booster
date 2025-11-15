import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Auth email handler invoked");
    
    const payload: AuthHookPayload = await req.json();
    console.log("Email action type:", payload.email_data.email_action_type);
    console.log("User email:", payload.user.email);

    const rawApiKey = Deno.env.get("RESEND_API_KEY");
    const resendApiKey = rawApiKey?.trim();

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("RESEND_API_KEY environment variable is required");
    }

    // Validate API key
    if (["\r", "\n"].some((c) => resendApiKey.includes(c)) || !/^[\x20-\x7E]+$/.test(resendApiKey)) {
      console.error("RESEND_API_KEY contains invalid characters");
      throw new Error("RESEND_API_KEY contains invalid characters");
    }

    let html = "";
    let subject = "";

    // Route to appropriate email template based on action type
    switch (payload.email_data.email_action_type) {
      case "signup":
      case "user_confirmation": {
        // Welcome email
        const fullName = payload.user.user_metadata?.full_name || payload.user.email.split("@")[0];
        subject = "Witaj w PhotoApp! 🎉";
        html = createWelcomeEmail(fullName);
        console.log("Sending welcome email to:", payload.user.email);
        break;
      }

      case "recovery":
      case "magiclink": {
        // Password reset email
        const resetLink = `${payload.email_data.site_url}/auth/confirm?token_hash=${payload.email_data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(payload.email_data.redirect_to)}`;
        subject = "Zresetuj hasło w PhotoApp 🔒";
        html = createPasswordResetEmail(resetLink, payload.email_data.token);
        console.log("Sending password reset email to:", payload.user.email);
        break;
      }

      case "invite": {
        // Invite email (future feature)
        subject = "Zaproszenie do PhotoApp";
        html = createInviteEmail(payload.email_data.token_hash);
        console.log("Sending invite email to:", payload.user.email);
        break;
      }

      default:
        console.error("Unknown email action type:", payload.email_data.email_action_type);
        throw new Error(`Unsupported email action type: ${payload.email_data.email_action_type}`);
    }

    // Send email via Resend
    console.log("Sending email via Resend API...");
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: new Headers({
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        from: "PhotoApp <noreply@resend.dev>",
        to: [payload.user.email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const result = await resendResponse.json();
    console.log("Email sent successfully via Resend:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in auth-email-handler:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function createWelcomeEmail(fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Witaj w PhotoApp!</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1a202c; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 30px; line-height: 1.3;">
          Witaj ${fullName}! 🎉
        </h1>
        
        <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Dziękujemy za dołączenie do PhotoApp! Masz już dostęp do:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
          <tr><td style="color: #374151; font-size: 15px; line-height: 28px; padding: 4px 0;">✨ 50 darmowych kredytów</td></tr>
          <tr><td style="color: #374151; font-size: 15px; line-height: 28px; padding: 4px 0;">📸 AI Photo Enhancement</td></tr>
          <tr><td style="color: #374151; font-size: 15px; line-height: 28px; padding: 4px 0;">👤 Własne modele AI</td></tr>
          <tr><td style="color: #374151; font-size: 15px; line-height: 28px; padding: 4px 0;">🎨 Virtual Try-On</td></tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="https://photoapp.com/enhance" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Rozpocznij teraz
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 24px 0 0;">
          Miłej zabawy! 🚀
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
          Zespół PhotoApp<br>
          <a href="https://photoapp.com" style="color: #7c3aed; text-decoration: none;">photoapp.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function createPasswordResetEmail(resetLink: string, verificationCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zresetuj hasło w PhotoApp</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1a202c; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 30px; line-height: 1.3;">
          🔒 Reset hasła
        </h1>
        
        <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
          Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta PhotoApp.
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
          Kliknij poniższy przycisk, aby ustawić nowe hasło:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <a href="${resetLink}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Zresetuj hasło
              </a>
            </td>
          </tr>
        </table>
        
        ${verificationCode ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; text-align: center;">
          <tr>
            <td>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px;">Lub użyj kodu weryfikacyjnego:</p>
              <div style="display: inline-block; padding: 16px 24px; background-color: #f4f4f4; border-radius: 6px; border: 1px solid #e5e7eb;">
                <code style="color: #1a202c; font-size: 24px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', monospace;">${verificationCode}</code>
              </div>
            </td>
          </tr>
        </table>
        ` : ''}
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; border: 1px solid #fbbf24;">
          <tr>
            <td>
              <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0;">
                ⚠️ <strong>Uwaga:</strong> Link wygasa za 1 godzinę. Jeśli nie prosiłeś o reset hasła, zignoruj tego emaila.
              </p>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0;">
          Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:
        </p>
        
        <p style="color: #7c3aed; font-size: 13px; line-height: 20px; word-break: break-all; margin: 8px 0 0; font-family: monospace;">
          ${resetLink}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
          Zespół PhotoApp<br>
          <a href="https://photoapp.com" style="color: #7c3aed; text-decoration: none;">photoapp.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function createInviteEmail(tokenHash: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zaproszenie do PhotoApp</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1a202c; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 30px; line-height: 1.3;">
          🎉 Zaproszenie do PhotoApp
        </h1>
        
        <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
          Zostałeś zaproszony do dołączenia do PhotoApp!
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="https://photoapp.com/invite?token=${tokenHash}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Przyjmij zaproszenie
              </a>
            </td>
          </tr>
        </table>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
          Zespół PhotoApp
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
