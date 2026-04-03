import "server-only";

export type TranscriptSummary = {
  tldr: string;
  keyPoints: string[];
  detailedSummary: string;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_SUMMARY_MODEL || "llama-3.1-8b-instant";
const MAX_CHARS_PER_CHUNK = 10000;

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function enforceFiveKeyPoints(points: string[]): string[] {
  const cleaned = points.map((point) => normalizeText(point)).filter(Boolean);
  if (cleaned.length >= 5) {
    return cleaned.slice(0, 5);
  }

  if (cleaned.length === 0) {
    return ["Main idea overview", "Core concept", "Important takeaway", "Practical implication", "Closing insight"];
  }

  const padded = [...cleaned];
  while (padded.length < 5) {
    padded.push(cleaned[padded.length % cleaned.length]);
  }

  return padded;
}

function splitTranscriptIntoChunks(transcript: string, maxChunkChars = MAX_CHARS_PER_CHUNK): string[] {
  const normalized = normalizeText(transcript);
  if (normalized.length <= maxChunkChars) {
    return [normalized];
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (!sentence) {
      continue;
    }

    if ((currentChunk + " " + sentence).trim().length > maxChunkChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      if (sentence.length > maxChunkChars) {
        for (let index = 0; index < sentence.length; index += maxChunkChars) {
          chunks.push(sentence.slice(index, index + maxChunkChars).trim());
        }
        currentChunk = "";
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk = `${currentChunk} ${sentence}`.trim();
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(Boolean);
}

function parseSummaryPayload(payload: string): TranscriptSummary {
  const jsonMatch = payload.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Groq response.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<TranscriptSummary>;

  return {
    tldr: normalizeText(parsed.tldr || ""),
    keyPoints: enforceFiveKeyPoints(
      Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map((point) => normalizeText(String(point))).filter(Boolean)
        : []
    ),
    detailedSummary: normalizeText(parsed.detailedSummary || ""),
  };
}

async function requestSummary(content: string, contextLabel: string): Promise<TranscriptSummary> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize YouTube transcripts. Return only valid JSON with keys tldr, keyPoints, and detailedSummary.",
        },
        {
          role: "user",
          content: `Summarize the ${contextLabel} below. Requirements:
- tldr: exactly 2 sentences
- keyPoints: exactly 5 short bullet-ready strings
- detailedSummary: 150 to 200 words in one clear paragraph
- respond with JSON only using this exact shape:
{
  "tldr": "",
  "keyPoints": [""],
  "detailedSummary": ""
}

Content:
${content}`,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const payload = data.choices?.[0]?.message?.content;

  if (!payload) {
    throw new Error("Groq returned an empty response.");
  }

  return parseSummaryPayload(payload);
}

export async function summarizeTranscript(transcript: string): Promise<TranscriptSummary> {
  const normalizedTranscript = normalizeText(transcript);
  if (!normalizedTranscript) {
    throw new Error("Transcript is empty.");
  }

  const chunks = splitTranscriptIntoChunks(normalizedTranscript);
  if (chunks.length === 1) {
    return requestSummary(chunks[0], "transcript");
  }

  const chunkSummaries: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunkSummary = await requestSummary(chunks[index], `transcript chunk ${index + 1} of ${chunks.length}`);
    chunkSummaries.push(
      [
        `Chunk ${index + 1}:`,
        `TLDR: ${chunkSummary.tldr}`,
        `Key Points: ${chunkSummary.keyPoints.join(" | ")}`,
        `Details: ${chunkSummary.detailedSummary}`,
      ].join("\n")
    );
  }

  return requestSummary(chunkSummaries.join("\n\n"), "combined transcript summaries");
}
