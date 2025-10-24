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

    const { meetingId } = await req.json();
    console.log('[GENERATE-SUMMARY] Generating summary for meeting:', meetingId);

    // Get meeting data
    const { data: meeting } = await supabaseClient
      .from('meetings')
      .select('*, transcripts(*), extractions(*)')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const transcript = meeting.transcripts[0]?.full_text || 
      meeting.transcripts[0]?.segments.map((s: any) => `${s.speaker}: ${s.text}`).join('\n') || '';
    
    const extractions = meeting.extractions || [];

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate summary
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales coach. Create concise, actionable summaries of sales calls in Markdown format. Include key points, outcomes, next steps, and important insights. Keep it professional and focused on what matters for the sales team.',
          },
          {
            role: 'user',
            content: `Summarize this sales call:

Meeting: ${meeting.title}
Participants: ${JSON.stringify(meeting.participants)}

Transcript:
${transcript}

Key Information Extracted:
${extractions.map((e: any) => `${e.field_label}: ${e.value}`).join('\n')}

Please provide a structured summary with sections: Overview, Key Discussion Points, Extracted Insights, and Next Steps.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable workspace.');
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0]?.message?.content || '';

    console.log('[GENERATE-SUMMARY] Summary generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      summary 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GENERATE-SUMMARY] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});