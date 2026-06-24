import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, estate, compsCount, conservativePrice, midMarketPrice, strongPrice, medianPricePerM2, askingPrice } = body;

  const prompt = `You are writing a professional market commentary for a South African luxury property Comparable Market Analysis (CMA) report for Home Ground Real Estate on the KwaZulu-Natal North Coast.

Subject property: ${address}, ${estate}
Number of comparable sales: ${compsCount}
Median price per m²: R${Math.round(medianPricePerM2).toLocaleString("en-ZA")}
Conservative indication: R${Math.round(conservativePrice).toLocaleString("en-ZA")}
Mid-market indication: R${Math.round(midMarketPrice).toLocaleString("en-ZA")}
Strong market indication: R${Math.round(strongPrice).toLocaleString("en-ZA")}
${askingPrice ? `Current asking price: R${Number(askingPrice).toLocaleString("en-ZA")}` : ""}

Write exactly 2 sentences of professional market commentary suitable for a luxury real estate CMA. Focus on what the comparable sales data indicates about market conditions and the subject property's position. Be specific and authoritative. Do not include any headers or labels — just the two sentences.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ narrative: text });
  } catch {
    return NextResponse.json({
      narrative: `Analysis of ${compsCount} comparable sales within the ${estate} indicates a median market rate of R${Math.round(medianPricePerM2).toLocaleString("en-ZA")}/m², establishing the market-derived value range shown above. Buyers and sellers operating within this range can expect transaction timelines consistent with current estate market conditions.`,
    });
  }
}
