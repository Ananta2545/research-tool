# MoneyStories Research — Earnings Call Analyzer

A **Vertical AI Tool** that transforms raw earnings call transcripts into structured, dashboard-ready research. Upload a PDF, and in seconds receive management sentiment, key positives, risks, forward guidance, capacity utilization, and growth initiatives — all extracted by AI acting as a senior equity research analyst.

**Live Demo:** _[Add your Vercel URL here after deployment]_

---

## What It Does

Users upload an earnings call transcript (PDF), the backend extracts text and sends it to an LLM with a domain-expert prompt, and the frontend renders the structured JSON response as an interactive research dashboard.

```
User (Browser)                           Server (Next.js API Route)
    │                                          │
    ├── 1. Upload PDF ────────────────────────▶│
    │      (drag-drop or click)                │
    │                                          ├── 2. Extract text (pdf-parse)
    │                                          │
    │                                          ├── 3. Send to LLM (Groq API)
    │                                          │      with structured analyst prompt
    │                                          │
    │◀── 4. Receive structured JSON ──────────│
    │                                          │
    ├── 5. Render Dashboard                    │
    │      (6 visual sections)                 │
```

---

## How It Works — Step by Step

### Step 1: Upload (Frontend)

- The user lands on a clean upload screen with the headline *"Turn conference calls into actionable research."*
- They can **drag & drop** a PDF or **click to browse** files.
- The frontend validates before sending:
  - File type must be `application/pdf` → otherwise shows an inline error.
  - File size must be ≤ 20 MB → otherwise shows an inline error.
- The file is packaged into `FormData` and sent via `POST` to `/api/analyze`.

### Step 2: PDF Text Extraction (Backend)

- The API route receives the uploaded PDF as `FormData`.
- It uses **pdf-parse** (v1.1.1) to extract raw text from the binary PDF buffer.
- If extracted text is less than 100 characters → returns an error (file is likely scanned/image-based).
- Text is **truncated to 20,000 characters** (~5,000 tokens) to stay within the free-tier token limits of Groq.

### Step 3: LLM Analysis (Backend)

- The extracted text is sent to **Groq's API** using the `llama-3.3-70b-versatile` model.
- A detailed **system prompt** instructs the LLM to act as a senior equity research analyst and return a **strict JSON object** with exactly these fields:

| Field | Type | Description |
|---|---|---|
| `sentiment` | `"Optimistic" \| "Cautious" \| "Neutral" \| "Pessimistic"` | Overall management tone label |
| `sentiment_reasoning` | `string` | 2-3 sentences citing specific transcript phrases that justify the tone |
| `confidence_score` | `"High" \| "Medium" \| "Low"` | How specific and clear management's guidance was |
| `positives` | `string[]` | 3-5 key positive signals management highlighted |
| `negatives` | `string[]` | 3-5 risks, concerns, or headwinds mentioned |
| `guidance` | `{ metric, outlook, timeframe }[]` | Structured table of forward-looking metrics |
| `capacity_utilization` | `string` | 1-2 sentence summary of capacity trends |
| `growth_initiatives` | `string[]` | 3+ growth initiatives with brief details |

- The call uses `response_format: { type: "json_object" }` to **guarantee** valid JSON output (no markdown, no extra text).
- Temperature is set to **0.2** (low randomness → consistent, factual output).
- `max_tokens: 2000` ensures the response is detailed but capped.

### Step 4: API Response

- The JSON response from the LLM is parsed and returned to the frontend.
- Error handling covers: missing file, wrong file type, empty PDF, empty AI response, and network failures.

### Step 5: Dashboard Rendering (Frontend)

The JSON is typed against the `AnalysisResult` interface and the dashboard renders **6 visual sections** with staggered fade-up animations:

| Section | What it Shows | Visual Treatment |
|---|---|---|
| **Management Tone** | Sentiment label + color bar + reasoning text | Green / amber / gray / red background based on tone |
| **Guidance Clarity** | Confidence score badge | Bordered badge (green / amber / red) |
| **Key Positives** | Numbered bullet list (3-5 items) | Green numbers, white card |
| **Risks & Concerns** | Numbered bullet list (3-5 items) | Red numbers, white card |
| **Forward Guidance** | Table: Metric / Outlook / Period columns | Hover-highlighted rows |
| **Capacity + Growth** | Utilization summary + growth initiatives list | Dark navy cards with gold accents |

---

## Assignment Requirements Checklist

This project implements **Option B: Earnings Call / Management Commentary Summary**. Here is exactly how each requirement is met:

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Accept PDF uploads of earnings call transcripts | ✅ | Drag-drop + file picker with PDF/size validation |
| 2 | Process with an LLM to extract structured information | ✅ | Groq API with `llama-3.3-70b-versatile`, JSON mode |
| 3 | Overall management sentiment | ✅ | Color-coded tone bar with reasoning text |
| 4 | Key positives highlighted by management | ✅ | 3-5 items in numbered green list |
| 5 | Key negatives or risk factors | ✅ | 3-5 items in numbered red list |
| 6 | Forward guidance / outlook | ✅ | Structured table with Metric, Outlook, Period |
| 7 | Capacity utilization data | ✅ | Dark card with summary (or "Not mentioned") |
| 8 | Growth initiatives and plans | ✅ | 3+ items in gold-accented list |
| 9 | Clean, dashboard-style UI | ✅ | Custom editorial finance design with animations |
| 10 | Deploy to public URL (Vercel) | ✅ | Builds cleanly, ready for Vercel deployment |

---

## How Judgment Calls Are Handled

| Challenge | Approach |
|---|---|
| **Tone assessment** | LLM classifies sentiment AND provides a `sentiment_reasoning` field citing **specific phrases** from the transcript — not a vague label. |
| **Vague guidance** | System prompt instructs: *"If forward guidance is vague, quote management directly rather than interpreting."* |
| **Hallucination prevention** | System prompt enforces: *"Only extract information explicitly stated in the transcript. NEVER infer, estimate, or hallucinate numbers."* Low temperature (0.2) reinforces this. |
| **Missing sections** | If a metric isn't discussed, the LLM returns `"Not discussed in this call"` / `"Not mentioned in transcript"`. The UI renders this gracefully. |
| **Token limits** | Transcript text is truncated to 20K chars (~5K tokens) to fit within Groq's free-tier 12K TPM limit. |

---

## Tech Stack

| Technology | Role |
|---|---|
| **Next.js 16** (App Router) | Full-stack framework — frontend + API route in one project |
| **TypeScript** | Strict typing for frontend-backend contract (`AnalysisResult` interface) |
| **Tailwind CSS v4** | Utility-first styling with `@theme inline` tokens |
| **Groq SDK** | LLM inference API — free tier, `llama-3.3-70b-versatile` model |
| **pdf-parse** | Server-side PDF text extraction |
| **Vercel** | Deployment target (serverless edge functions) |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- A **Groq API key** (free) — [get one here](https://console.groq.com/keys)

### Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd research-tool

# 2. Install dependencies
npm install

# 3. Add your API key
#    Create a .env.local file:
echo "GROQ_API_KEY=gsk_your-key-here" > .env.local

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload an earnings call PDF.

---

## Deploy to Vercel

1. Push this repo to **GitHub**.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo.
3. In **Environment Variables**, add:
   - `GROQ_API_KEY` = `gsk_your-key-here`
4. Click **Deploy**. Your public URL is live.

---

## Project Structure

```
research-tool/
├── app/
│   ├── api/analyze/route.ts   ← Backend: PDF text extraction + Groq LLM call
│   ├── page.tsx               ← Frontend: upload zone + results dashboard (SPA)
│   ├── layout.tsx             ← Root layout with Geist fonts + metadata
│   └── globals.css            ← CSS variables, animations, theme
├── lib/
│   └── types.ts               ← TypeScript interfaces (AnalysisResult, GuidanceItem)
├── types/
│   └── pdf-parse.d.ts         ← Type declarations for pdf-parse module
├── next.config.ts             ← serverExternalPackages for pdf-parse
├── .env.local                 ← GROQ_API_KEY (not committed to git)
├── .env.example               ← Template for environment variables
└── package.json
```

---

## Design Decisions

| Decision | Why |
|---|---|
| **Next.js App Router** | Full-stack in one project — frontend + API route. Ideal for Vercel deployment with zero config. |
| **Groq + Llama 3.3 70B** | Free tier, extremely fast inference (~2-3s), 70B parameter model gives high-quality structured output for finance analysis. |
| **JSON mode** | `response_format: { type: "json_object" }` guarantees valid JSON — eliminates parsing failures entirely. |
| **Temperature 0.2** | Finance analysis needs consistency and accuracy, not creative writing. Low temperature reduces hallucination risk. |
| **20K char truncation** | Groq free tier allows ~12K tokens/minute. 20K characters ≈ 5K tokens, leaving headroom for the system prompt + response. |
| **pdf-parse via createRequire** | Next.js 16's Turbopack wraps CJS modules incorrectly. `createRequire(import.meta.url)` bypasses this by using Node.js's native require. |
| **serverExternalPackages** | Tells the bundler to skip bundling pdf-parse (it uses native Node.js APIs that can't be bundled). |
| **Custom color scheme** | Navy (#0c1b2a) + Gold (#c9a84c) + Cream (#faf8f2) — editorial finance aesthetic that stands out from generic AI tool UIs. |

---

## Limitations

- **File size:** PDFs up to 20 MB. Transcript text is truncated to 20,000 characters.
- **Scanned PDFs:** Image-based or scanned PDFs won't work — the tool requires text-based PDFs.
- **Latency:** Analysis takes 3-10 seconds depending on transcript length and Groq API load.
- **Vercel timeout:** Serverless functions on Vercel free tier have a 60-second timeout. Most transcripts process well within this.
- **Free tier rate limits:** Groq free tier allows ~30 requests/minute and ~12K tokens/minute.

---

## License

MIT
