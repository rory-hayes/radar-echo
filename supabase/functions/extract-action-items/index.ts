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

    const { meetingId, transcript } = await req.json();
    console.log('[EXTRACT-ACTION-ITEMS] Extracting action items for meeting:', meetingId);

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
            content: `You are an AI assistant that extracts action items from meeting transcripts. Identify:
- Explicit commitments ("I will...", "We will...")
- Tasks assigned to specific people
- Follow-up actions mentioned
- Deadlines or timeframes

Return structured JSON data with clear, actionable tasks.`,
          },
          {
            role: 'user',
            content: `Extract action items from this transcript:\n\n${transcript}\n\nIdentify who is responsible for each task and any mentioned deadlines.`,
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_action_items',
            description: 'Extract action items from meeting transcript',
            parameters: {
              type: 'object',
              properties: {
                actionItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string', description: 'The action item description' },
                      ownerName: { type: 'string', description: 'Person responsible (if mentioned)' },
                      dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format (if mentioned)' }
                    },
                    required: ['text']
                  }
                }
              },
              required: ['actionItems']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_action_items' } }
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
    const actionItems = toolCall ? JSON.parse(toolCall.function.arguments).actionItems : [];

    // Save action items to database
    const insertedItems = [];
    for (const item of actionItems) {
      const { data: inserted } = await supabaseClient.from('action_items').insert({
        meeting_id: meetingId,
        text: item.text,
        owner_name: item.ownerName || null,
        due_date: item.dueDate || null,
        status: 'pending',
      }).select().single();
      
      if (inserted) {
        insertedItems.push(inserted);
      }
    }

    console.log(`[EXTRACT-ACTION-ITEMS] Saved ${insertedItems.length} action items`);

    return new Response(JSON.stringify({ 
      success: true, 
      actionItems: insertedItems 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[EXTRACT-ACTION-ITEMS] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});