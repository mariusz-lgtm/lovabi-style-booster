import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const resetSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  resetLink: z.string().url("Invalid reset link"),
  verificationCode: z.string().length(6).optional()
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Password reset email function invoked");
    
    // Parse and validate request body
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: parsed.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, resetLink, verificationCode } = parsed.data;
    console.log(`Sending password reset email to: ${email}`);

    // Create HTML email template
    const html = `
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
                <code style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a202c; font-family: monospace;">${verificationCode}</code>
              </div>
            </td>
          </tr>
        </table>
        ` : ''}
        
        <p style="color: #dc2626; font-size: 14px; font-weight: 500; text-align: center; margin: 20px 0;">
          ⏰ Link jest ważny przez 1 godzinę.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; border: 1px solid #fbbf24;">
          <tr>
            <td>
              <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
                ⚠️ <strong>Jeśli to nie Ty</strong>, zignoruj tego emaila. Twoje hasło pozostanie bez zmian.
              </p>
            </td>
          </tr>
        </table>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 32px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          © 2025 PhotoApp. Wszystkie prawa zastrzeżone.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "PhotoApp <noreply@resend.dev>",
      to: [email],
      subject: "Zresetuj hasło w PhotoApp 🔒",
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Password reset email sent successfully:", data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to send password reset email:", error.message);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email", 
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
