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

    const { meetingId, transcript, frameworkFields } = await req.json();
    console.log('[PROCESS-TRANSCRIPT] Processing transcript for meeting:', meetingId);

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare framework context for AI
    const frameworkContext = frameworkFields.map((f: any) => 
      `${f.label}: ${f.questions.join(', ')}`
    ).join('\n');

    // Call Lovable AI for extraction
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
            content: `You are an AI sales intelligence assistant. Extract relevant information from sales call transcripts based on the given framework.

Framework fields:
${frameworkContext}

Return your response as JSON array with format:
[{
  "field": "field_key",
  "label": "Field Label", 
  "value": "extracted information",
  "confidence": 0.95,
  "sourceSegmentId": "segment_id"
}]

Only include fields where you found relevant information. Be concise but accurate.`,
          },
          {
            role: 'user',
            content: `Extract information from this transcript:\n\n${transcript}`,
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_framework_data',
            description: 'Extract structured data from sales call transcript',
            parameters: {
              type: 'object',
              properties: {
                extractions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      label: { type: 'string' },
                      value: { type: 'string' },
                      confidence: { type: 'number' },
                      sourceSegmentId: { type: 'string' }
                    },
                    required: ['field', 'label', 'value', 'confidence']
                  }
                }
              },
              required: ['extractions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_framework_data' } }
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
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const extractions = toolCall ? JSON.parse(toolCall.function.arguments).extractions : [];

    // Save extractions to database
    for (const extraction of extractions) {
      await supabaseClient.from('extractions').insert({
        meeting_id: meetingId,
        framework_field: extraction.field,
        field_label: extraction.label,
        value: extraction.value,
        confidence: extraction.confidence,
        source_segment_id: extraction.sourceSegmentId,
      });
    }

    console.log(`[PROCESS-TRANSCRIPT] Saved ${extractions.length} extractions`);

    return new Response(JSON.stringify({ 
      success: true, 
      extractionsCount: extractions.length,
      extractions 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PROCESS-TRANSCRIPT] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});