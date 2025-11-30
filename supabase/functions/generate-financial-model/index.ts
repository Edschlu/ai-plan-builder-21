import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive prompt for financial model generation
    const prompt = `You are an expert financial modeler. Generate a comprehensive 24-month financial model for the following startup:

Company: ${formData.companyName}
Business Model: ${formData.businessModel}
Target Market: ${formData.targetMarket}
Product: ${formData.productDescription}
Revenue Model: ${formData.revenueModel}
Initial Investment: $${formData.initialInvestment}
Monthly Burn: $${formData.monthlyBurn}
Team Size: ${formData.teamSize}
Launch Date: ${formData.launchDate}
${formData.competitorAnalysis ? `Competitors: ${formData.competitorAnalysis}` : ''}

Generate a detailed financial model with:
1. Monthly revenue projections (realistic growth curve based on business model)
2. Detailed cost breakdown by category
3. Personnel plan with hiring schedule
4. Cashflow forecast
5. Cumulative liquidity tracking
6. Burn rate and runway calculations

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "companyName": "${formData.companyName}",
  "businessModel": "${formData.businessModel}",
  "targetMarket": "${formData.targetMarket}",
  "revenueModel": "${formData.revenueModel}",
  "initialInvestment": ${formData.initialInvestment},
  "monthlyBurn": ${formData.monthlyBurn},
  "teamSize": ${formData.teamSize},
  "totalRevenue": <number>,
  "runway": <number>,
  "companyOverview": "<brief overview>",
  "valueProposition": "<value prop>",
  "customerSegments": "<segments>",
  "growthStrategy": "<strategy>",
  "averageRevenuePerCustomer": <number>,
  "customerAcquisitionCost": <number>,
  "churnRate": <number>,
  "growthRate": <number>,
  "monthlyData": [
    {
      "month": 1,
      "revenue": <number>,
      "costs": <number>,
      "netCashflow": <number>,
      "cumulativeLiquidity": <number>,
      "headcount": <number>
    }
  ],
  "personnelPlan": [
    {
      "role": "<role name>",
      "count": <number>,
      "salary": <annual salary>
    }
  ],
  "keyActivities": ["<activity>"],
  "keyResources": ["<resource>"],
  "keyPartnerships": ["<partnership>"],
  "costStructure": ["<cost category with %>"]
}

Important:
- Generate realistic projections based on the business model type
- Consider typical growth curves for ${formData.businessModel} businesses
- Personnel costs should be 50-70% of total costs
- Revenue should grow gradually, not linearly
- Include seasonal variations where appropriate`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a financial modeling expert. Always return valid JSON without markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;
    
    // Parse the AI response, removing any markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const financialModel = JSON.parse(cleanContent);

    return new Response(JSON.stringify(financialModel), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating financial model:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to generate financial model"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
