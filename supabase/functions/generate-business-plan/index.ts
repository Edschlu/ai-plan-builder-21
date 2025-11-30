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
    const { name, description, businessModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate a comprehensive business plan for: ${name}

Description: ${description}

Business Model Context:
${JSON.stringify(businessModel, null, 2)}

Create a detailed business plan with these sections. Return ONLY valid JSON (no markdown):

{
  "problem_solution": {
    "problem": "<describe the problem>",
    "solution": "<how this solves it>",
    "uniqueValue": "<what makes it special>"
  },
  "target_users": {
    "primary": "<main user group>",
    "secondary": "<secondary group>",
    "characteristics": ["<trait 1>", "<trait 2>", "<trait 3>"]
  },
  "customer_segments": {
    "segments": [
      {"name": "<segment>", "size": "<market size>", "needs": "<key needs>"}
    ]
  },
  "competitive_insight": "<competitive landscape and advantages>",
  "revenue_logic": {
    "model": "<revenue model>",
    "streams": ["<stream 1>", "<stream 2>"],
    "projections": "<revenue expectations>"
  },
  "cost_structure": {
    "fixed": ["<fixed cost 1>", "<fixed cost 2>"],
    "variable": ["<variable cost 1>", "<variable cost 2>"],
    "cac": <number>
  },
  "hiring_assumptions": {
    "year1": {"roles": ["<role>"], "total": <number>},
    "year2": {"roles": ["<role>"], "total": <number>}
  },
  "kpis": {
    "metrics": [
      {"name": "<KPI>", "target": "<value>", "importance": "<why it matters>"}
    ]
  },
  "risks": {
    "items": [
      {"risk": "<risk>", "mitigation": "<how to handle>", "severity": "<low/medium/high>"}
    ]
  },
  "investor_summary": "<compelling 2-paragraph pitch>"
}`;

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
            content: "You are a business planning expert. Always return valid JSON without markdown."
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
    
    const businessPlan = JSON.parse(cleanContent);

    return new Response(JSON.stringify(businessPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating business plan:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to generate business plan"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
