import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to compress images before upload (reduces size by ~70-90%)
async function compressImageBuffer(buffer: Uint8Array): Promise<Uint8Array> {
  try {
    // Decode PNG image
    const image = await Image.decode(buffer);
    
    // Resize to 1024x1024 (reduces size by ~55%)
    image.resize(1024, 1024);
    
    // Encode as JPEG with 60% quality (further reduces size by ~70-90% total)
    return await image.encodeJPEG(60);
  } catch (error) {
    console.error('Image compression failed, using original buffer:', error);
    // Fallback to original buffer if compression fails
    return buffer;
  }
}

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
    let inputImageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
    
    const originalInputSize = inputImageBuffer.length;
    console.log('Input image original size:', originalInputSize, 'bytes (~' + (originalInputSize / 1024 / 1024).toFixed(2) + ' MB)');
    
    // Compress input image before upload (resize 1024×1024 + JPEG 60%)
    console.log('Compressing input image (resize 1024×1024 + JPEG 60% quality)...');
    // @ts-ignore - Type incompatibility between Uint8Array<ArrayBuffer> and Uint8Array<ArrayBufferLike>
    inputImageBuffer = await compressImageBuffer(inputImageBuffer);
    const compressedInputSize = inputImageBuffer.length;
    const inputCompressionRatio = ((1 - compressedInputSize / originalInputSize) * 100).toFixed(1);
    console.log('Compressed input image size:', compressedInputSize, 'bytes (~' + (compressedInputSize / 1024 / 1024).toFixed(2) + ' MB)');
    console.log('Input compression ratio:', inputCompressionRatio + '% reduction');
    
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

      let modelBodyType = '';
      let modelHeightCm = 0;

      if (isCustomModel) {
        console.log('Fetching body type and generated portrait for custom model:', modelId);
        
        const { data: modelData, error: modelError } = await supabaseClient
          .from('user_models')
          .select('body_type, height_cm, generated_portrait_path')
          .eq('id', modelId)
          .eq('user_id', user.id)
          .single();

        if (modelError || !modelData?.generated_portrait_path) {
          console.error('Generated portrait not found:', modelError);
          throw new Error('Generated portrait not found for this model');
        }

        modelBodyType = modelData.body_type || '';
        modelHeightCm = modelData.height_cm || 0;
        
        console.log(`Model body type: ${modelBodyType}, height: ${modelHeightCm}cm`);
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

${isCustomModel ? `CRITICAL BODY TYPE MATCHING — NON-NEGOTIABLE:
- The model MUST have the EXACT body type from the portrait: ${modelBodyType}
- Body proportions: ${modelBodyType} build with ${modelHeightCm}cm height proportions
- Match shoulder width, body frame, waist, hips, and overall body shape precisely
- NO idealization, slimming, smoothing, or ANY modification of body shape
- The body type ${modelBodyType} must be clearly visible and accurately represented
- If the portrait shows ${modelBodyType} figure, the try-on MUST show ${modelBodyType} figure
- Height proportions for ${modelHeightCm}cm stature must be maintained exactly

CRITICAL: Use the provided AI-generated portrait as the EXACT reference for the model's appearance:
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

${isCustomModel ? `CRITICAL BODY TYPE MATCHING — NON-NEGOTIABLE:
- The model MUST have the EXACT body type from the portrait: ${modelBodyType}
- Body proportions: ${modelBodyType} build with ${modelHeightCm}cm height proportions
- Match shoulder width, body frame, waist, hips, and overall body shape precisely
- NO idealization, slimming, smoothing, or ANY modification of body shape
- The body type ${modelBodyType} must be clearly visible and accurately represented
- If the portrait shows ${modelBodyType} figure, the selfie MUST show ${modelBodyType} figure
- Height proportions for ${modelHeightCm}cm stature must be maintained exactly

CRITICAL: Use the provided AI-generated portrait as the EXACT reference for the model's appearance:
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

    console.log('Calling Lovable AI for image generation...');
    console.log('Mode:', mode, 'Model:', modelId, 'Style:', photoStyle, 'Background:', backgroundType);
    console.log('Reference images count:', referenceImages.length);

    // Create abort controller for timeout (120 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: aiMessages,
          modalities: ["image", "text"]
        }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('AI generation timed out after 120 seconds');
        throw new Error('Image generation timed out. Please try again with a smaller image or different settings.');
      }
      console.error('Network error during AI call:', fetchError);
      throw new Error('Network error during image generation. Please check your connection and try again.');
    }

    clearTimeout(timeoutId);
    console.log('AI response received, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("Payment required. Please contact support.");
      }
      if (response.status === 413) {
        throw new Error("Image too large. Please use a smaller image.");
      }
      
      throw new Error(`AI generation failed with status ${response.status}`);
    }

    console.log('Parsing AI response...');
    const data = await response.json();
    console.log('AI response parsed successfully');
    const generatedImageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageBase64) {
      console.error('No image in AI response. Response structure:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated from AI');
    }

    console.log('Converting and uploading generated image to storage...');
    const outputFileName = `${user.id}/${Date.now()}_output.jpg`;
    let outputImageBuffer = Uint8Array.from(
      atob(generatedImageBase64.split(',')[1]), 
      c => c.charCodeAt(0)
    );

    const originalSize = outputImageBuffer.length;
    console.log('Original output image size:', originalSize, 'bytes (~' + (originalSize / 1024 / 1024).toFixed(2) + ' MB)');
    
    // Compress image before upload to prevent 413 errors
    console.log('Compressing output image (resize 1536→1024 + JPEG 60% quality)...');
    // @ts-ignore - Type incompatibility between Uint8Array<ArrayBuffer> and Uint8Array<ArrayBufferLike>
    outputImageBuffer = await compressImageBuffer(outputImageBuffer);
    const compressedSize = outputImageBuffer.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log('Compressed output image size:', compressedSize, 'bytes (~' + (compressedSize / 1024 / 1024).toFixed(2) + ' MB)');
    console.log('Compression ratio:', compressionRatio + '% reduction');

    // Upload with auto-retry on 413 error
    let outputUploadError = null;
    let uploadSuccess = false;
    
    const { error: firstUploadError } = await supabaseClient.storage
      .from('generated-images')
      .upload(outputFileName, outputImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (firstUploadError) {
      // Check if it's a 413 error (object too large)
      if (firstUploadError.message?.includes('413') || firstUploadError.message?.includes('exceeded')) {
        console.log('Upload failed with 413 - retrying with stronger compression (768×768 + JPEG 50%)...');
        
        try {
          // Decode and re-compress with more aggressive settings
          const image = await Image.decode(outputImageBuffer);
          image.resize(768, 768);
          const ultraCompressedBuffer = await image.encodeJPEG(50);
          
          const ultraCompressedSize = ultraCompressedBuffer.length;
          console.log('Ultra-compressed output size:', ultraCompressedSize, 'bytes (~' + (ultraCompressedSize / 1024 / 1024).toFixed(2) + ' MB)');
          
          const { error: retryUploadError } = await supabaseClient.storage
            .from('generated-images')
            .upload(outputFileName, ultraCompressedBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });
          
          if (!retryUploadError) {
            uploadSuccess = true;
            console.log('Retry upload successful after stronger compression');
          } else {
            outputUploadError = retryUploadError;
          }
        } catch (retryError) {
          console.error('Retry compression/upload failed:', retryError);
          outputUploadError = firstUploadError;
        }
      } else {
        outputUploadError = firstUploadError;
      }
    } else {
      uploadSuccess = true;
    }

    if (!uploadSuccess) {
      console.error('Error uploading output image:', outputUploadError);
      throw new Error('Failed to upload generated image');
    }

    console.log('Image uploaded successfully:', outputFileName);

    const { data: urlData } = supabaseClient.storage
      .from('generated-images')
      .getPublicUrl(outputFileName);

    // Deduct credit ONLY after successful image generation and upload
    console.log('Deducting credit after successful generation and upload...');
    const { data: deductResult, error: deductError } = await supabaseClient
      .rpc('deduct_credit', { p_user_id: user.id });

    if (deductError || !deductResult) {
      console.error('Failed to deduct credit after successful generation:', deductError);
      // Image was generated successfully but credit deduction failed - log but don't throw
      console.error('WARNING: Image generated but credit not deducted for user:', user.id);
    } else {
      console.log('Credit deducted successfully after generation for user:', user.id);
    }

    const generationTime = Date.now() - startTime;
    console.log('Total generation time:', generationTime, 'ms');

    console.log('Saving to generation history...');
    const { error: historyError } = await supabaseClient.from('generation_history').insert({
      user_id: user.id,
      model_used: modelId || 'enhance',
      style_used: photoStyle || mode,
      background_used: backgroundType,
      input_image_path: inputFileName,
      output_image_path: outputFileName,
      generation_time_ms: generationTime
    });

    if (historyError) {
      console.error('Failed to save generation history:', historyError);
      // Don't throw - the image was generated successfully, just history logging failed
    }

    console.log('Generation completed successfully');
    return new Response(
      JSON.stringify({
        imageUrl: urlData.publicUrl,
        generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-photo-enhancement:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred during image generation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
