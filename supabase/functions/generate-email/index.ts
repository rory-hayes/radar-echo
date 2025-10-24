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

    const { meetingId, summary, actionItems } = await req.json();
    console.log('[GENERATE-EMAIL] Generating follow-up email for meeting:', meetingId);

    // Get meeting data
    const { data: meeting } = await supabaseClient
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: 'You are a professional sales representative. Write concise, friendly follow-up emails after sales calls. Keep it brief, actionable, and professional. Use a warm but business-appropriate tone.',
          },
          {
            role: 'user',
            content: `Write a follow-up email for this sales call:

Meeting: ${meeting.title}
Participants: ${JSON.stringify(meeting.participants)}

Summary:
${summary}

Action Items:
${actionItems?.map((item: any) => `- ${item.text} (Owner: ${item.owner_name || 'TBD'})`).join('\n') || 'None'}

The email should:
1. Thank them for their time
2. Recap key points discussed
3. List next steps/action items
4. Include a clear call to action
5. Keep it under 200 words

Return ONLY the email body (no subject line).`,
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
    const emailBody = aiData.choices[0]?.message?.content || '';

    console.log('[GENERATE-EMAIL] Email generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      emailBody,
      subject: `Following up on ${meeting.title}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GENERATE-EMAIL] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});