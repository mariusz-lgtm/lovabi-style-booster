import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { imageBase64, mode, modelId, photoStyle, backgroundType } = await req.json();

    if (!imageBase64 || !mode) {
      throw new Error('Missing required fields: imageBase64, mode');
    }

    const startTime = Date.now();

    const inputFileName = `${user.id}/${Date.now()}.jpg`;
    const inputImageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
    
    const { error: uploadError } = await supabaseClient.storage
      .from('input-images')
      .upload(inputFileName, inputImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    let prompt = '';
    let referenceImages: any[] = [];

    if (mode === 'enhance') {
      prompt = `Task: Enhance the provided image of a garment to meet high-quality professional photography standards while strictly preserving the original look, color, texture, and design of the clothing item.

Required Enhancements:

Wrinkle Removal/Smoothing: Digitally iron the garment, meticulously removing all visible wrinkles, creases, and folds to present a smooth, crisp, and ready-to-wear appearance.

Lighting and Exposure Correction: Optimize the lighting to achieve a balanced, even, and flattering illumination. Eliminate harsh shadows or overexposed areas. The light source should mimic professional studio soft-box lighting.

Color Fidelity and Contrast: Adjust contrast, saturation, and white balance to ensure maximum color fidelity, making the garment's true color and detail pop without looking artificial.

Presentation and Background: Refine the background to be clean, neutral (e.g., pure white, light gray, or a subtly textured studio backdrop), and non-distracting, ensuring the clothing is the sole focal point.

Goal: Transform the image into a high-end, e-commerce-ready product photograph suitable for professional catalogs and online retail.`;
    } else if (mode === 'virtual-tryon') {
      const isCustomModel = modelId && modelId.length === 36;

      if (isCustomModel) {
        const { data: modelPhotos, error: photosError } = await supabaseClient
          .from('model_photos')
          .select('storage_path')
          .eq('model_id', modelId)
          .order('photo_order');

        if (photosError) throw photosError;

        if (modelPhotos && modelPhotos.length > 0) {
          for (const photo of modelPhotos) {
            const { data: imageData } = await supabaseClient.storage
              .from('model-photos')
              .download(photo.storage_path);

            if (imageData) {
              const arrayBuffer = await imageData.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              referenceImages.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64}` }
              });
            }
          }
        }
      }

      const stylePrompts = {
        studio: `Professional fashion photography of a woman wearing the clothing item shown. Style: Studio photoshoot with professional lighting setup. Background: ${backgroundType === 'white' ? 'Pure white seamless backdrop' : backgroundType === 'studio-grey' ? 'Neutral grey studio backdrop' : backgroundType === 'outdoor' ? 'Natural outdoor setting with soft daylight' : 'Modern home interior with natural lighting'}. Camera: High-end DSLR, 85mm lens, shallow depth of field (f/2.8). Lighting: Three-point lighting with soft key light from 45 degrees, fill light, and rim light for separation. Model pose: Confident, natural stance showcasing the garment. Post-processing: Professional retouching, commercial color grading, crisp details. Quality: Editorial fashion magazine standard, 4K resolution. ${isCustomModel ? 'Use the reference images provided to match the model appearance.' : ''}`,
        selfie: `Casual selfie-style photo of a young woman wearing the clothing item shown. Style: Natural indoor lighting, smartphone camera aesthetic. Background: ${backgroundType === 'white' ? 'Clean white wall' : backgroundType === 'home-interior' ? 'Cozy home interior (bedroom or living room)' : backgroundType === 'outdoor' ? 'Casual outdoor setting (park or street)' : 'Simple neutral background'}. Camera: Smartphone camera quality, slight wide angle, natural color tone. Pose: Relaxed, authentic mirror selfie or arm-extended selfie angle. Mood: Approachable, relatable, Instagram-style. Quality: Natural smartphone photo with slight enhancement, warm color tone. ${isCustomModel ? 'Match the model appearance from the reference images provided.' : ''}`
      };

      prompt = stylePrompts[photoStyle as keyof typeof stylePrompts] || stylePrompts.studio;

      if (!isCustomModel) {
        const modelPrompts: Record<string, string> = {
          emma: 'Model appearance: Professional European woman, 25-30 years old, elegant and polished style, brown hair, confident expression.',
          sofia: 'Model appearance: Modern Mediterranean woman, 22-28 years old, contemporary fashion sense, dark wavy hair, warm smile.',
          maya: 'Model appearance: Young diverse woman, 20-25 years old, trendy street style, various hairstyles, energetic vibe.'
        };
        prompt += '\n' + (modelPrompts[modelId || ''] || modelPrompts.emma);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiMessages: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt.trim() },
          { type: "image_url", image_url: { url: imageBase64 } },
          ...referenceImages
        ]
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: aiMessages,
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const generatedImageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageBase64) {
      throw new Error('No image generated');
    }

    const outputFileName = `${user.id}/${Date.now()}_output.png`;
    const outputImageBuffer = Uint8Array.from(
      atob(generatedImageBase64.split(',')[1]), 
      c => c.charCodeAt(0)
    );

    const { error: outputUploadError } = await supabaseClient.storage
      .from('generated-images')
      .upload(outputFileName, outputImageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (outputUploadError) throw outputUploadError;

    const { data: urlData } = supabaseClient.storage
      .from('generated-images')
      .getPublicUrl(outputFileName);

    const generationTime = Date.now() - startTime;

    await supabaseClient.from('generation_history').insert({
      user_id: user.id,
      model_used: modelId || 'enhance',
      style_used: photoStyle || mode,
      background_used: backgroundType,
      input_image_path: inputFileName,
      output_image_path: outputFileName,
      generation_time_ms: generationTime
    });

    return new Response(
      JSON.stringify({
        imageUrl: urlData.publicUrl,
        generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-photo-enhancement:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
