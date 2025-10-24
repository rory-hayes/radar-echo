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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { confirmEmail } = await req.json();
    
    if (confirmEmail !== user.email) {
      throw new Error('Email confirmation does not match');
    }

    console.log('[DELETE-USER-DATA] Deleting data for user:', user.id);

    // Log the deletion BEFORE deleting data
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'data_deletion_requested',
      resource_type: 'user_data',
      resource_id: user.id,
      details: { 
        requestedAt: new Date().toISOString(),
        email: user.email 
      },
    });

    // Delete recordings from storage
    const { data: meetings } = await supabaseClient
      .from('meetings')
      .select('recording_url')
      .eq('created_by', user.id);

    if (meetings) {
      for (const meeting of meetings) {
        if (meeting.recording_url) {
          const fileName = meeting.recording_url.split('/').pop();
          if (fileName) {
            await supabaseClient.storage
              .from('recordings')
              .remove([fileName]);
          }
        }
      }
    }

    // Delete user data (cascading deletes will handle related records)
    // Action items owned by user
    await supabaseClient
      .from('action_items')
      .delete()
      .eq('owner_id', user.id);

    // Meetings created by user (will cascade to transcripts, extractions, etc.)
    await supabaseClient
      .from('meetings')
      .delete()
      .eq('created_by', user.id);

    // User roles
    await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    // Organization memberships
    await supabaseClient
      .from('organization_members')
      .delete()
      .eq('user_id', user.id);

    // Profile
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      throw new Error(`Failed to delete auth user: ${deleteError.message}`);
    }

    console.log('[DELETE-USER-DATA] Deletion completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'All user data has been permanently deleted' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[DELETE-USER-DATA] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});