import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createRequire } from "module";

// Use createRequire to bypass Turbopack's CJS→ESM wrapping
const require2 = createRequire(import.meta.url);
const pdfParse = require2("pdf-parse");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a senior equity research analyst at a top-tier investment bank.
Analyze the provided earnings call transcript or management commentary and return a **strict JSON** object with the following schema.

{
  "sentiment": "Optimistic" | "Cautious" | "Neutral" | "Pessimistic",
  "sentiment_reasoning": "2-3 sentence explanation citing specific phrases from the transcript that justify your sentiment classification.",
  "confidence_score": "High" | "Medium" | "Low",
  "positives": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "negatives": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "guidance": [
    { "metric": "Revenue", "outlook": "description or direct quote", "timeframe": "FY2025 / Q3 2025 / etc." },
    { "metric": "EBITDA Margin", "outlook": "description or direct quote", "timeframe": "..." },
    { "metric": "Capex", "outlook": "description or direct quote", "timeframe": "..." }
  ],
  "capacity_utilization": "A 1-2 sentence summary of capacity utilization trends mentioned. Use 'Not mentioned in transcript' if absent.",
  "growth_initiatives": ["initiative 1 with brief detail", "initiative 2", "initiative 3"]
}

CRITICAL RULES:
1. Only extract information **explicitly stated** in the transcript. NEVER infer, estimate, or hallucinate numbers.
2. If forward guidance is vague, **quote management directly** rather than interpreting.
3. Return between 3-5 items for positives, negatives, and growth_initiatives. Never fewer than 3.
4. For guidance, include at least revenue, margin, and capex if mentioned. If a metric is not discussed, set outlook to "Not discussed in this call" and timeframe to "N/A".
5. The confidence_score reflects how clear and specific the management's guidance was — not your confidence in the analysis.
6. Keep each bullet point concise (1-2 sentences max).
7. Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded. Please select a PDF file." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF document." },
        { status: 400 }
      );
    }

    // 1. Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    let text: string = pdfData.text;

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not extract sufficient text from the PDF. The file may be scanned/image-based or empty.",
        },
        { status: 422 }
      );
    }

    // Truncate to ~20k chars (~5k tokens) to stay within Groq free tier limits
    if (text.length > 20000) {
      text = text.slice(0, 20000);
    }

    // 2. Call Groq (Llama 3)
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze the following earnings call transcript:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Processing failed: ${message}` },
      { status: 500 }
    );
  }
}
