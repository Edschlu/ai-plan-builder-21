import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, description, businessModel } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are a financial planning expert. Generate a structured financial table for this business idea:

Business: ${name}
Description: ${description}
Business Model: ${JSON.stringify(businessModel || {})}

Create a financial table structure with:

1. Categories (4-6 main categories):
   - Revenue categories (e.g., "Product Sales", "Subscriptions")
   - Cost categories (e.g., "Operations", "Marketing", "Salaries")
   - Type for each: revenue, cost, headcount, investment

2. Rows (8-12 specific line items):
   - Specific revenue streams under revenue categories
   - Specific cost items under cost categories
   - Include realistic monthly values for 24 months
   - Mark recurring items (e.g., monthly subscriptions)
   - Add payment delays where relevant (30-90 days)

3. Forecast assumptions:
   - Realistic revenue growth rate (5-30%)
   - Cost inflation rate (2-5%)
   - Starting cash needed

Make values realistic for this type of business. Start conservative and show growth.
Return ONLY valid JSON with this structure:
{
  "categories": [
    {"name": "string", "type": "revenue|cost|headcount|investment", "color": "#hex"}
  ],
  "rows": [
    {
      "name": "string",
      "category_type": "revenue|cost|headcount|investment",
      "type": "revenue|cost|headcount|investment",
      "values": [24 monthly numbers],
      "is_recurring": boolean,
      "payment_delay_days": 0-90
    }
  ],
  "assumptions": {
    "revenue_growth_rate": 10,
    "cost_inflation_rate": 3,
    "starting_cash": 50000
  }
}`;

    console.log('Calling Lovable AI to generate financial table structure...');
    
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
            content: 'You are a financial planning expert. Always return valid JSON only, no markdown or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');
    
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Clean JSON from markdown code blocks
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const tableData = JSON.parse(content);

    // Validate structure
    if (!tableData.categories || !tableData.rows) {
      throw new Error('Invalid table structure from AI');
    }

    console.log('Financial table generated successfully');
    
    return new Response(
      JSON.stringify(tableData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in generate-financial-table:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});