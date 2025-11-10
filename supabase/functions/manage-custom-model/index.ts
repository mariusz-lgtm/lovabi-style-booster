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

    const { action, modelId, modelName, photos, setActive } = await req.json();

    switch (action) {
      case 'create': {
        if (!modelName || !photos || photos.length === 0) {
          throw new Error('Missing modelName or photos');
        }

        const { data: newModel, error: createError } = await supabaseClient
          .from('user_models')
          .insert({
            user_id: user.id,
            name: modelName,
            is_active: setActive || false
          })
          .select()
          .single();

        if (createError) throw createError;

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

        // Check if model was active before deletion
        const { data: model } = await supabaseClient
          .from('user_models')
          .select('is_active')
          .eq('id', modelId)
          .eq('user_id', user.id)
          .single();

        const wasActive = model?.is_active;

        // Get photos to delete from storage
        const { data: photos } = await supabaseClient
          .from('model_photos')
          .select('storage_path')
          .eq('model_id', modelId);

        // Delete files from storage
        if (photos && photos.length > 0) {
          const paths = photos.map(p => p.storage_path);
          await supabaseClient.storage
            .from('model-photos')
            .remove(paths);
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

        // If deleted model was active, reset preferences to Emma
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

        return new Response(
          JSON.stringify({ success: true, resetToDefault: wasActive }),
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
