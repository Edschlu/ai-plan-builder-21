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
    const { name, description, preset } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are a business modeling expert. Generate a comprehensive business model for the following startup idea:

Name: ${name}
Description: ${description}
Type: ${preset}

Generate a structured business model with:
1. Value Proposition (clear, compelling)
2. Target Customers (specific segments)
3. Revenue Streams (2-4 streams)
4. Pricing Model (with specific prices)
5. Go-to-Market Strategy (3-5 tactics)
6. Cost Structure (key cost categories)
7. Key Assumptions (3-5 critical assumptions)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "valueProposition": "<clear value prop>",
  "targetCustomers": ["<segment 1>", "<segment 2>", "<segment 3>"],
  "revenueStreams": [
    {"name": "<stream name>", "description": "<how it works>"}
  ],
  "pricingModel": {
    "type": "<subscription/one-time/freemium/etc>",
    "prices": [
      {"tier": "<tier name>", "price": <number>, "features": ["<feature>"]}
    ]
  },
  "goToMarket": ["<strategy 1>", "<strategy 2>", "<strategy 3>"],
  "costStructure": [
    {"category": "<cost name>", "monthly": <number>, "type": "<fixed/variable>"}
  ],
  "keyAssumptions": ["<assumption 1>", "<assumption 2>", "<assumption 3>"]
}

Make the business model realistic and actionable for a ${preset} business.`;

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
            content: "You are a business modeling expert. Always return valid JSON without markdown formatting."
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
    
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const businessModel = JSON.parse(cleanContent);

    return new Response(JSON.stringify(businessModel), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating business model:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to generate business model"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
