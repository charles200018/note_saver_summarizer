export async function summarizeTranscript(transcript: string): Promise<{
  tldr: string;
  keyPoints: string[];
  detailedSummary: string;
}> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in deployment environment variables.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes YouTube video transcripts. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: `Summarize this YouTube video transcript. Return ONLY valid JSON with this exact structure:
{
  "tldr": "A 2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "detailedSummary": "A detailed paragraph summary"
}

Transcript:
${transcript.slice(0, 12000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    tldr: parsed.tldr || "",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    detailedSummary: parsed.detailedSummary || "",
  };
}
