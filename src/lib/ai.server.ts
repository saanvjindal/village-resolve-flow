import { CATEGORY_KEYS, type CategoryKey } from "./departments";

export type Classification = { category: CategoryKey; priority: "low" | "medium" | "high"; summary: string };

const FALLBACK: Classification = { category: "other", priority: "medium", summary: "" };

export async function classifyComplaint(description: string, village: string): Promise<Classification> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { ...FALLBACK, summary: description.slice(0, 140) };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions:
        "You classify rural citizen grievances in India for routing to government departments. The complaint may be in Hindi, English or any Indian language. Categories: road, water, electricity, sanitation, healthcare, agriculture, scheme (government welfare scheme/pension/ration/benefit issues), other. Priority high = danger to life/health or whole village affected; low = minor inconvenience. Summary: one short English sentence under 25 words.",
      input: `Village: ${village}\nComplaint: ${description}`,
      text: {
        format: {
          type: "json_schema",
          name: "classification",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["category", "priority", "summary"],
            properties: {
              category: { type: "string", enum: CATEGORY_KEYS },
              priority: { type: "string", enum: ["low", "medium", "high"] },
              summary: { type: "string" },
            },
          },
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    console.error("AI classify failed", res.status, await res.text().catch(() => ""));
    return { ...FALLBACK, summary: description.slice(0, 140) };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta") text += evt.delta;
      } catch {
        /* ignore */
      }
    }
  }

  try {
    const parsed = JSON.parse(text);
    const category = CATEGORY_KEYS.includes(parsed.category) ? parsed.category : "other";
    const priority = ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium";
    return { category, priority, summary: String(parsed.summary ?? "").slice(0, 300) };
  } catch {
    console.error("AI parse failed", text);
    return { ...FALLBACK, summary: description.slice(0, 140) };
  }
}
