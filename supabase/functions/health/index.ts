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

    // Check database connection
    const { error: dbError } = await supabaseClient
      .from('profiles')
      .select('count')
      .limit(1);

    if (dbError) {
      throw new Error(`Database check failed: ${dbError.message}`);
    }

    // Check AI gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiStatus = LOVABLE_API_KEY ? 'configured' : 'not_configured';

    // Check Stripe
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeStatus = STRIPE_SECRET_KEY ? 'configured' : 'not_configured';

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        ai_gateway: aiStatus,
        stripe: stripeStatus,
      },
      version: '1.0.0',
    };

    return new Response(JSON.stringify(health), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[HEALTH] Error:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});