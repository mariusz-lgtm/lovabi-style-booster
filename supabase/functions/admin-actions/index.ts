import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, userId, generationId, reason } = await req.json();
    console.log('Admin action:', action, { userId, generationId, reason });

    switch (action) {
      case 'ban-user': {
        if (!userId || !reason) {
          return new Response(JSON.stringify({ error: 'Missing userId or reason' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_reason: reason,
          })
          .eq('id', userId);

        if (error) throw error;

        console.log('User banned successfully:', userId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unban-user': {
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Missing userId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_banned: false,
            banned_at: null,
            banned_reason: null,
          })
          .eq('id', userId);

        if (error) throw error;

        console.log('User unbanned successfully:', userId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-generation': {
        if (!generationId) {
          return new Response(JSON.stringify({ error: 'Missing generationId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get generation details
        const { data: generation, error: fetchError } = await supabaseAdmin
          .from('generation_history')
          .select('input_image_path, output_image_path')
          .eq('id', generationId)
          .single();

        if (fetchError) throw fetchError;

        // Delete from storage
        const filesToDelete = [];
        if (generation.input_image_path) filesToDelete.push(generation.input_image_path);
        if (generation.output_image_path) filesToDelete.push(generation.output_image_path);

        if (filesToDelete.length > 0) {
          const { error: inputDeleteError } = await supabaseAdmin.storage
            .from('input-images')
            .remove([generation.input_image_path]);

          const { error: outputDeleteError } = await supabaseAdmin.storage
            .from('generated-images')
            .remove([generation.output_image_path]);

          if (inputDeleteError) console.error('Error deleting input:', inputDeleteError);
          if (outputDeleteError) console.error('Error deleting output:', outputDeleteError);
        }

        // Delete from database
        const { error: deleteError } = await supabaseAdmin
          .from('generation_history')
          .delete()
          .eq('id', generationId);

        if (deleteError) throw deleteError;

        console.log('Generation deleted successfully:', generationId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Error in admin-actions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
