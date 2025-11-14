import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const emailSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  fullName: z.string().trim().min(1, "Name is required").max(100, "Name too long")
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
    console.log("Welcome email function invoked");
    
    // Parse and validate request body
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);
    
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

    const { email, fullName } = parsed.data;
    console.log(`Sending welcome email to: ${email}`);

    const rawApiKey = Deno.env.get("RESEND_API_KEY");
    const resendApiKey = rawApiKey?.trim();

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("RESEND_API_KEY environment variable is required");
    }

    // Disallow CR/LF and non-printable ASCII to avoid invalid ByteString in headers
    if (["\r", "\n"].some((c) => resendApiKey.includes(c)) || !/^[\x20-\x7E]+$/.test(resendApiKey)) {
      console.error("RESEND_API_KEY contains invalid characters");
      throw new Error("RESEND_API_KEY contains invalid characters; please regenerate and re-add the key");
    }

    console.log("Resend API key validated, length:", resendApiKey.length);

    // Create HTML email template
    const html = `
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
              <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('revgpspqpkjncosctnxo.supabase.co', 'revgpspqpkjncosctnxo.lovable.app') || 'https://your-app.lovable.app'}/enhance" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Wygeneruj pierwsze zdjęcie
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 20px; text-align: center; margin: 30px 0 20px;">
          Masz pytania? Odpowiedz na ten email lub skontaktuj się z nami.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 32px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          © 2025 PhotoApp. Wszystkie prawa zastrzeżone.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend using fetch API directly
    console.log("Sending email via Resend API...");
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: new Headers({
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        from: "PhotoApp <noreply@resend.dev>",
        to: [email],
        subject: "Witaj w PhotoApp! 🎨",
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const data = await resendResponse.json();
    console.log("Email sent successfully via Resend:", data);

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
    console.error("Failed to send welcome email:", error.message);
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
