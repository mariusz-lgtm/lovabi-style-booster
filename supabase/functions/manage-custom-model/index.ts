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
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) throw new Error('Unauthorized');

    const { action, modelId, modelName, photos, setActive, age, bodyType, heightCm, skinTone, hairDescription, additionalNotes } = await req.json();

    switch (action) {
      case 'create': {
        if (!modelName || !photos || photos.length < 3) {
          throw new Error('Missing modelName or minimum 3 photos required');
        }

        console.log('Creating custom model with portrait generation...');

        // Step 1: Create user_models record
        const { data: newModel, error: createError } = await supabaseClient
          .from('user_models')
          .insert({
            user_id: user.id,
            name: modelName,
            is_active: setActive || false,
            age,
            body_type: bodyType,
            height_cm: heightCm,
            skin_tone: skinTone,
            hair_description: hairDescription,
            additional_notes: additionalNotes
          })
          .select()
          .single();

        if (createError) throw createError;

        // Step 2: Upload original photos to storage
        for (let i = 0; i < photos.length && i < 3; i++) {
          const photoBase64 = photos[i];
          const fileName = `${user.id}/${newModel.id}/photo_${i + 1}.jpg`;
          
          const imageBuffer = Uint8Array.from(
            atob(photoBase64.split(',')[1]),
            c => c.charCodeAt(0)
          );

          const { error: uploadError } = await supabaseClient.storage
            .from('model-photos')
            .upload(fileName, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          await supabaseClient.from('model_photos').insert({
            model_id: newModel.id,
            storage_path: fileName,
            photo_order: i + 1
          });
        }

        console.log('Original photos uploaded, generating AI portrait...');

        // Step 3: Generate AI portrait using Lovable AI
        const portraitPrompt = `Generate a professional studio portrait (headshot and upper body) of a woman based on the provided reference images and description.

CRITICAL: Output MUST be perfect square format — 1:1 aspect ratio, 1536×1536 pixels. Non-negotiable.

Reference Images Analysis:
- Use all ${photos.length} provided reference images to accurately capture the person's appearance
- Match facial features, face shape, eyes, nose, mouth, and overall likeness precisely
- Replicate skin tone, complexion, and any distinctive features faithfully

Physical Description to Match:
- Age: ${age} years old
- Body Type: ${bodyType} — maintain this exact body type and build
- Height: ${heightCm}cm — ensure proportions match this height
- Skin Tone: ${skinTone} — reproduce accurately
- Hair: ${hairDescription}
${additionalNotes ? `- Additional characteristics: ${additionalNotes}` : ''}

Portrait Specifications:
- Professional studio portrait photography
- Clean white or neutral background (seamless backdrop)
- Three-point studio lighting — soft, even, flattering
- Camera: Full-frame DSLR, 85mm portrait lens, f/2.8
- Composition: Upper body visible (head, shoulders, chest), centered framing
- Expression: Natural, confident, friendly — suitable for fashion modeling
- Clothing: Simple, elegant top in neutral color (white, black, beige)
- Styling: Professional but approachable — suitable for e-commerce fashion photography

CRITICAL BODY TYPE MATCHING:
- Replicate the exact body type from reference images: ${bodyType}
- Match shoulder width, body frame, and overall proportions precisely
- Maintain height proportions for ${heightCm}cm stature
- NO idealization, slimming, or modification of body shape
- The portrait must show the same physical build as in the reference photos

Quality & Format:
- 1:1 aspect ratio, 1536×1536 pixels exactly
- Ultra high-resolution, sharp focus, professional retouching
- Natural skin tones, realistic lighting, editorial quality
- This portrait will be used as a reference for virtual clothing try-on

CRITICAL: The generated portrait must look like the EXACT same person from the reference images — same face, same body type, same proportions. Match the physical description provided precisely. NO idealization or significant alteration.

CRITICAL REMINDER: Output MUST be 1:1 square aspect ratio, 1536×1536 pixels exactly.`;

        const content = [
          { type: "text", text: portraitPrompt },
          ...photos.map((photoBase64: string) => ({
            type: "image_url",
            image_url: { url: photoBase64 }
          }))
        ];

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content }],
            modalities: ["image", "text"]
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI generation error:', aiResponse.status, errorText);
          throw new Error(`AI portrait generation failed: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const generatedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImageBase64) {
          throw new Error('No image returned from AI');
        }

        console.log('AI portrait generated, uploading to storage...');

        // Step 4: Upload generated portrait to storage
        const portraitBuffer = Uint8Array.from(
          atob(generatedImageBase64.split(',')[1]),
          c => c.charCodeAt(0)
        );

        const portraitPath = `${user.id}/${newModel.id}/generated_portrait.png`;
        const { error: portraitUploadError } = await supabaseClient.storage
          .from('model-photos')
          .upload(portraitPath, portraitBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (portraitUploadError) throw portraitUploadError;

        // Step 5: Update user_models with generated_portrait_path
        await supabaseClient
          .from('user_models')
          .update({ generated_portrait_path: portraitPath })
          .eq('id', newModel.id);

        console.log('Portrait uploaded successfully:', portraitPath);

        // Step 6: Update preferences if setActive
        if (setActive) {
          await supabaseClient.from('model_preferences').upsert({
            user_id: user.id,
            selected_model_id: newModel.id,
            photo_style: 'studio',
            background_type: 'white'
          });
        }

        return new Response(
          JSON.stringify({ success: true, modelId: newModel.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!modelId) throw new Error('Missing modelId');

        console.log('Deleting model:', modelId);

        // Get model data
        const { data: model } = await supabaseClient
          .from('user_models')
          .select('is_active, generated_portrait_path')
          .eq('id', modelId)
          .eq('user_id', user.id)
          .single();

        const wasActive = model?.is_active;

        // Get and delete original photos
        const { data: photos } = await supabaseClient
          .from('model_photos')
          .select('storage_path')
          .eq('model_id', modelId);

        if (photos && photos.length > 0) {
          const paths = photos.map(p => p.storage_path);
          await supabaseClient.storage
            .from('model-photos')
            .remove(paths);
        }

        // Delete generated portrait if exists
        if (model?.generated_portrait_path) {
          await supabaseClient.storage
            .from('model-photos')
            .remove([model.generated_portrait_path]);
        }

        // Delete model_photos records
        await supabaseClient
          .from('model_photos')
          .delete()
          .eq('model_id', modelId);

        // Delete user_models record
        const { error: deleteError } = await supabaseClient
          .from('user_models')
          .delete()
          .eq('id', modelId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Reset preferences if active
        if (wasActive) {
          await supabaseClient
            .from('model_preferences')
            .upsert({
              user_id: user.id,
              selected_model_id: 'emma',
              photo_style: 'studio',
              background_type: 'white'
            });
        }

        console.log('Model deleted successfully');

        return new Response(
          JSON.stringify({ success: true, resetToDefault: wasActive }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'regenerate': {
        if (!modelId) throw new Error('Missing modelId');

        console.log('Regenerating portrait for model:', modelId);

        // Get model data
        const { data: model, error: modelError } = await supabaseClient
          .from('user_models')
          .select(`
            *,
            model_photos (storage_path, photo_order)
          `)
          .eq('id', modelId)
          .eq('user_id', user.id)
          .single();

        if (modelError || !model) throw new Error('Model not found');

        // Download original photos
        const sortedPhotos = model.model_photos.sort((a: any, b: any) => a.photo_order - b.photo_order);
        const photoBase64Array = await Promise.all(
          sortedPhotos.map(async (p: any) => {
            const { data: photoData } = await supabaseClient.storage
              .from('model-photos')
              .download(p.storage_path);

            if (!photoData) throw new Error('Failed to download photo');

            const arrayBuffer = await photoData.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            let binaryString = '';
            const chunkSize = 8192;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.subarray(i, i + chunkSize);
              binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            
            const base64Image = btoa(binaryString);
            return `data:image/jpeg;base64,${base64Image}`;
          })
        );

        console.log('Original photos downloaded, regenerating AI portrait...');

        // Regenerate portrait with same logic as CREATE
        const portraitPrompt = `Generate a professional studio portrait (headshot and upper body) of a woman based on the provided reference images and description.

CRITICAL: Output MUST be perfect square format — 1:1 aspect ratio, 1536×1536 pixels. Non-negotiable.

Reference Images Analysis:
- Use all ${photoBase64Array.length} provided reference images to accurately capture the person's appearance
- Match facial features, face shape, eyes, nose, mouth, and overall likeness precisely
- Replicate skin tone, complexion, and any distinctive features faithfully

Physical Description to Match:
- Age: ${model.age} years old
- Body Type: ${model.body_type} — maintain this exact body type and build
- Height: ${model.height_cm}cm — ensure proportions match this height
- Skin Tone: ${model.skin_tone} — reproduce accurately
- Hair: ${model.hair_description}
${model.additional_notes ? `- Additional characteristics: ${model.additional_notes}` : ''}

Portrait Specifications:
- Professional studio portrait photography
- Clean white or neutral background (seamless backdrop)
- Three-point studio lighting — soft, even, flattering
- Camera: Full-frame DSLR, 85mm portrait lens, f/2.8
- Composition: Upper body visible (head, shoulders, chest), centered framing
- Expression: Natural, confident, friendly — suitable for fashion modeling
- Clothing: Simple, elegant top in neutral color (white, black, beige)
- Styling: Professional but approachable — suitable for e-commerce fashion photography

CRITICAL BODY TYPE MATCHING:
- Replicate the exact body type from reference images: ${model.body_type}
- Match shoulder width, body frame, and overall proportions precisely
- Maintain height proportions for ${model.height_cm}cm stature
- NO idealization, slimming, or modification of body shape
- The portrait must show the same physical build as in the reference photos

Quality & Format:
- 1:1 aspect ratio, 1536×1536 pixels exactly
- Ultra high-resolution, sharp focus, professional retouching
- Natural skin tones, realistic lighting, editorial quality
- This portrait will be used as a reference for virtual clothing try-on

CRITICAL: The generated portrait must look like the EXACT same person from the reference images — same face, same body type, same proportions. Match the physical description provided precisely. NO idealization or significant alteration.

CRITICAL REMINDER: Output MUST be 1:1 square aspect ratio, 1536×1536 pixels exactly.`;

        const content = [
          { type: "text", text: portraitPrompt },
          ...photoBase64Array.map((photoBase64: string) => ({
            type: "image_url",
            image_url: { url: photoBase64 }
          }))
        ];

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content }],
            modalities: ["image", "text"]
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI regeneration error:', aiResponse.status, errorText);
          throw new Error(`AI portrait regeneration failed: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const generatedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImageBase64) {
          throw new Error('No image returned from AI');
        }

        console.log('AI portrait regenerated, uploading to storage...');

        // Upload new portrait
        const portraitBuffer = Uint8Array.from(
          atob(generatedImageBase64.split(',')[1]),
          c => c.charCodeAt(0)
        );

        const portraitPath = `${user.id}/${modelId}/generated_portrait.png`;
        const { error: portraitUploadError } = await supabaseClient.storage
          .from('model-photos')
          .upload(portraitPath, portraitBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (portraitUploadError) throw portraitUploadError;

        // Update user_models with new generated_portrait_path
        await supabaseClient
          .from('user_models')
          .update({ generated_portrait_path: portraitPath })
          .eq('id', modelId);

        console.log('Portrait regenerated successfully:', portraitPath);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set-active': {
        if (!modelId) throw new Error('Missing modelId');

        const { error } = await supabaseClient.rpc('set_active_model', {
          p_user_id: user.id,
          p_model_id: modelId
        });

        if (error) throw error;

        await supabaseClient.from('model_preferences').upsert({
          user_id: user.id,
          selected_model_id: modelId,
          photo_style: 'studio',
          background_type: 'white'
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in manage-custom-model:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});