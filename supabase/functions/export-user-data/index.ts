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

    console.log('[EXPORT-USER-DATA] Exporting data for user:', user.id);

    // Gather all user data
    const userData: any = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      exportDate: new Date().toISOString(),
    };

    // Get profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    userData.profile = profile;

    // Get organizations user is part of
    const { data: orgMembers } = await supabaseClient
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id);
    userData.organizations = orgMembers;

    // Get user roles
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    userData.roles = roles;

    // Get meetings created by user
    const { data: meetings } = await supabaseClient
      .from('meetings')
      .select('*, transcripts(*), extractions(*), action_items(*)')
      .eq('created_by', user.id);
    userData.meetings = meetings;

    // Get action items owned by user
    const { data: actionItems } = await supabaseClient
      .from('action_items')
      .select('*')
      .eq('owner_id', user.id);
    userData.actionItems = actionItems;

    // Get audit logs for user
    const { data: auditLogs } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(1000);
    userData.auditLogs = auditLogs;

    // Log the export
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'data_export',
      resource_type: 'user_data',
      resource_id: user.id,
      details: { exportedAt: new Date().toISOString() },
    });

    console.log('[EXPORT-USER-DATA] Export completed successfully');

    return new Response(JSON.stringify(userData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="echo-data-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[EXPORT-USER-DATA] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});