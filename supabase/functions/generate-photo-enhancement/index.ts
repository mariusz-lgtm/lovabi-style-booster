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
      prompt = `CRITICAL: Output MUST be perfect square format — 1:1 aspect ratio, 1536×1536 pixels. Non-negotiable.

Task: Enhance the provided image of a garment to achieve premium, professional product-photography quality while perfectly preserving the garment's original look, color, fabric texture, stitching, and design details.

Required Enhancements:

Wrinkle Removal & Fabric Smoothing: Gently remove all wrinkles, folds, and creases from the garment. Present the clothing as freshly pressed and perfectly shaped, maintaining all natural fabric characteristics and edges.

Lighting & Exposure Optimization: Correct lighting to achieve clean, even illumination that mimics a professional studio soft-box setup. Remove any harsh shadows, glare, or underexposed areas for a balanced, natural look.

Color Fidelity & Contrast: Adjust color, contrast, and white balance for true-to-life tones. Ensure the garment's real color, material texture, and fabric weave are accurately represented and vivid, without artificial oversaturation or distortion.

Background Refinement: Replace or clean up the background to a pure white seamless backdrop (RGB 255,255,255). The background must be smooth, uniform, and non-distracting, ensuring the garment is the only focal point.

Detail Preservation: Maintain every small stitching detail, button, tag, label, and texture exactly as in the original photo — no visual alteration of the design or structure of the clothing.

Format & Composition: Generate the output in perfect square aspect ratio (1:1) with dimensions 1536×1536 pixels. Center the garment naturally within the frame with balanced margins on all sides, ensuring the entire item is fully visible and professionally presented.

Goal: Deliver a high-end, e-commerce-ready product image suitable for use in online stores, fashion catalogs, and professional retail listings — sharp, clean, and realistic with flawless presentation.

CRITICAL REMINDER: Output MUST be 1:1 square aspect ratio, 1536×1536 pixels. Do not deviate from this format.`;
    } else if (mode === 'virtual-tryon') {
      const isCustomModel = modelId && modelId.length === 36;
      console.log('Virtual try-on mode - modelId:', modelId, 'isCustomModel:', isCustomModel);

      if (isCustomModel) {
        console.log('Fetching generated portrait for custom model:', modelId);
        
        const { data: modelData, error: modelError } = await supabaseClient
          .from('user_models')
          .select('generated_portrait_path')
          .eq('id', modelId)
          .eq('user_id', user.id)
          .single();

        if (modelError || !modelData?.generated_portrait_path) {
          console.error('Generated portrait not found:', modelError);
          throw new Error('Generated portrait not found for this model');
        }

        console.log('Downloading generated portrait from storage:', modelData.generated_portrait_path);

        const { data: portraitData, error: downloadError } = await supabaseClient.storage
          .from('model-photos')
          .download(modelData.generated_portrait_path);

        if (downloadError || !portraitData) {
          console.error('Failed to download generated portrait:', downloadError);
          throw new Error('Failed to download generated portrait');
        }

        console.log('Converting portrait to base64...');
        const arrayBuffer = await portraitData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let binaryString = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        const base64Image = btoa(binaryString);
        const photoBase64 = `data:image/png;base64,${base64Image}`;

        referenceImages.push({
          type: "image_url",
          image_url: { url: photoBase64 }
        });

        console.log('Successfully added generated portrait as reference image');
      }

      const stylePrompts = {
        studio: `CRITICAL: Output MUST be perfect square format — 1:1 aspect ratio, 1536×1536 pixels. Non-negotiable.

Ultra-realistic professional fashion photography of a woman wearing exactly the same clothing item as shown in the reference image — every fabric detail, texture, and color must be perfectly matched and faithfully reproduced.

Style: High-end studio photoshoot with professional lighting and realistic skin tones.

Background (depends on backgroundType):
${backgroundType === 'white' ? '"white" → Pure white seamless backdrop for e-commerce look.' : ''}
${backgroundType === 'studio-grey' ? '"studio-grey" → Smooth neutral grey studio backdrop for balanced tones.' : ''}
${backgroundType === 'outdoor' ? '"outdoor" → Natural outdoor setting with soft daylight, realistic shadows.' : ''}
${backgroundType === 'home-interior' ? '"home-interior" → Modern home interior with natural window light, cozy atmosphere.' : ''}
${!backgroundType || (backgroundType !== 'white' && backgroundType !== 'studio-grey' && backgroundType !== 'outdoor' && backgroundType !== 'home-interior') ? 'default → Pure white seamless backdrop with professional studio lighting.' : ''}

Camera: Shot on a full-frame DSLR with 85mm portrait lens, aperture f/2.8 for shallow depth of field and crisp garment focus.

Lighting: Three-point professional studio lighting — soft key light at 45°, gentle fill light, and subtle rim light for separation and dimension.

Model pose: Confident, relaxed posture naturally showcasing the clothing fit, fabric flow, and texture.

Post-processing: Commercial-grade retouching and color grading; clean tones, realistic contrast, and ultra-sharp fabric details.

Format & Quality: Perfect square composition (1:1 aspect ratio), 1536×1536 pixels resolution. Editorial fashion magazine level — ultra high-resolution with perfect clarity, balanced framing with the model centered naturally in the frame.

${isCustomModel ? `CRITICAL: Use the provided AI-generated portrait as the EXACT reference for the model's appearance:
- This is a professionally generated portrait that captures the model's authentic look
- Match the face, body type, proportions, and physical characteristics precisely
- Maintain the same skin tone, hair style, facial features, and body build
- NO modifications or idealization — replicate the portrait appearance exactly
- The model in the generated image must look identical to the portrait reference

This portrait was created based on multiple real photos and detailed physical description to ensure accuracy and consistency.` : ''}

CRITICAL REMINDER: Output MUST be 1:1 square aspect ratio, 1536×1536 pixels exactly. Do not deviate from this format.`,
        selfie: `CRITICAL: Output MUST be perfect square format — 1:1 aspect ratio, 1536×1536 pixels. Non-negotiable.

Realistic mirror selfie photo of a young woman wearing exactly the same clothing item as shown in the reference image — all colors, textures, and garment details must be perfectly accurate and true to life.

Style: Casual, authentic mirror-selfie aesthetic captured indoors with natural lighting.

Background (depends on backgroundType):
${backgroundType === 'white' ? '"white" → Clean white wall or minimalist mirror reflection.' : ''}
${backgroundType === 'home-interior' ? '"home-interior" → Cozy bedroom or stylish living room with soft daylight.' : ''}
${backgroundType === 'outdoor' ? '"outdoor" → Mirror placed outdoors (e.g. garden or street), casual fashion vibe.' : ''}
${!backgroundType || (backgroundType !== 'white' && backgroundType !== 'home-interior' && backgroundType !== 'outdoor') ? 'default → Simple, neutral mirror background with realistic reflections.' : ''}

Camera: Smartphone front or main camera, realistic mirror reflection, slight wide-angle lens, handheld framing, natural exposure and tones.

Pose: Natural mirror selfie stance — one hand holding the phone, relaxed posture, showing full outfit fit and texture clearly.

Mood: Approachable, authentic, Instagram / Vinted aesthetic; spontaneous but flattering composition.

Post-processing: Light smartphone-style enhancement — gentle contrast, warm tones, sharp details of the clothing.

Format & Quality: Square mirror selfie composition (1:1 aspect ratio), 1536×1536 pixels resolution. High-resolution realistic photo with subtle mirror reflections, true-to-life lighting and proportions, balanced framing showing the full outfit clearly.

${isCustomModel ? `CRITICAL: Use the provided AI-generated portrait as the EXACT reference for the model's appearance:
- This is a professionally generated portrait that captures the model's authentic look
- Match the face, body type, proportions, and physical characteristics precisely
- Maintain the same skin tone, hair style, facial features, and body build from the portrait
- NO modifications or idealization — replicate the portrait appearance exactly
- The model in the selfie must look identical to the portrait reference

This portrait was created based on multiple real photos and detailed physical description to ensure accuracy and consistency.` : ''}

CRITICAL REMINDER: Output MUST be 1:1 square aspect ratio, 1536×1536 pixels exactly. Do not deviate from this format.`
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
