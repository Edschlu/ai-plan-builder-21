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
    const { monthlyData, categories, type } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'analyze') {
      systemPrompt = `You are a financial analyst specializing in startup cashflow. Analyze the provided data and give:
1. Key risks (runway warnings, burn rate spikes)
2. Optimization opportunities (cost reduction, revenue growth)
3. Actionable recommendations

Be concise, specific, and data-driven. Format as clear bullet points.`;

      const summary = {
        currentCash: monthlyData[0]?.cash || 0,
        avgBurnRate: monthlyData.slice(0, 3).reduce((sum: number, m: any) => 
          sum + Math.abs(Math.min(0, m.net)), 0) / 3,
        totalRevenue: monthlyData.reduce((sum: number, m: any) => sum + m.revenue, 0),
        totalCosts: monthlyData.reduce((sum: number, m: any) => sum + m.costs, 0),
        monthlyTrend: monthlyData.slice(0, 6).map((m: any) => ({
          month: m.month,
          net: m.net,
          cash: m.cash
        }))
      };

      userPrompt = `Analyze this startup's cashflow:
Current Cash: €${summary.currentCash.toLocaleString()}
Avg Burn Rate: €${summary.avgBurnRate.toLocaleString()}/month
Total Revenue (24 months): €${summary.totalRevenue.toLocaleString()}
Total Costs (24 months): €${summary.totalCosts.toLocaleString()}

Recent 6 months trend:
${summary.monthlyTrend.map((m: any) => 
  `Month ${m.month}: Net ${m.net >= 0 ? '+' : ''}€${m.net.toLocaleString()}, Cash: €${m.cash.toLocaleString()}`
).join('\n')}

Categories: ${categories.map((c: any) => c.name).join(', ')}`;

    } else if (type === 'forecast') {
      systemPrompt = `You are a financial forecasting expert. Based on historical data, predict the next 6 months of cashflow.
Provide specific monthly predictions considering:
- Revenue growth trends
- Cost patterns
- Seasonal variations
- Market conditions

Format: Month-by-month forecast with reasoning.`;

      userPrompt = `Forecast next 6 months based on this data:
${monthlyData.slice(0, 12).map((m: any) => 
  `M${m.month}: Revenue €${m.revenue.toLocaleString()}, Costs €${m.costs.toLocaleString()}, Net €${m.net.toLocaleString()}`
).join('\n')}`;

    } else if (type === 'suggest') {
      systemPrompt = `You are a cost optimization consultant. Review the provided expense categories and suggest:
1. 3-5 specific cost-cutting opportunities
2. Revenue enhancement ideas
3. Missing expense categories they should track

Be specific and actionable.`;

      userPrompt = `Suggest improvements for these cashflow categories:
${categories.map((c: any) => `- ${c.name} (${c.type})`).join('\n')}

Current monthly snapshot:
Revenue: €${monthlyData[0]?.revenue.toLocaleString()}
Costs: €${monthlyData[0]?.costs.toLocaleString()}`;
    }

    console.log('Calling Lovable AI with prompt:', { type, systemPrompt: systemPrompt.slice(0, 100) });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits in Settings.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const insight = data.choices[0].message.content;

    console.log('AI analysis complete:', { type, insightLength: insight.length });

    return new Response(
      JSON.stringify({ insight, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-cashflow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
