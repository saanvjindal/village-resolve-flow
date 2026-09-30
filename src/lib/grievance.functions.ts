import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATEGORIES, type MediaItem } from "./departments";

const fileSchema = z.object({ name: z.string().max(200), type: z.string().max(100), base64: z.string() });

const submitSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+\- ]{10,15}$/),
  village: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().min(10).max(3000),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  locationText: z.string().trim().max(300).optional().default(""),
  files: z.array(fileSchema).max(4).default([]),
});

const normPhone = (p: string) => p.replace(/\D/g, "").slice(-10);

export const submitComplaint = createServerFn({ method: "POST" })
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { classifyComplaint } = await import("./ai.server");

    const ai = await classifyComplaint(data.description, data.village);
    const cat = CATEGORIES[ai.category];
    const sla = new Date(Date.now() + cat.slaDays * 86400000).toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("complaints")
      .insert({
        name: data.name,
        phone: normPhone(data.phone),
        village: data.village,
        district: data.district || null,
        description: data.description,
        category: ai.category,
        department: cat.department,
        ai_summary: ai.summary,
        priority: ai.priority,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        location_text: data.locationText || null,
        status: "received",
        sla_due: sla,
      })
      .select("id, code")
      .single();
    if (error || !row) {
      console.error(error);
      throw new Error("Could not register complaint. Please try again.");
    }

    const media: MediaItem[] = [];
    for (const [i, f] of data.files.entries()) {
      if (!/^(image|video)\//.test(f.type)) continue;
      const bytes = Buffer.from(f.base64, "base64");
      if (bytes.length > 15 * 1024 * 1024) continue;
      const ext = f.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin";
      const path = `complaints/${row.id}/citizen-${i}.${ext}`;
      const up = await supabaseAdmin.storage.from("evidence").upload(path, bytes, { contentType: f.type });
      if (!up.error) media.push({ path, type: f.type });
    }
    if (media.length) await supabaseAdmin.from("complaints").update({ media }).eq("id", row.id);

    await supabaseAdmin.from("complaint_events").insert([
      { complaint_id: row.id, status: "submitted", note: "Complaint registered by citizen", actor: "citizen" },
      {
        complaint_id: row.id,
        status: "received",
        note: `AI classified as ${cat.label} (${ai.priority} priority) and routed to ${cat.department}`,
        actor: "system",
      },
    ]);

    return { code: row.code!, category: ai.category, department: cat.department, slaDue: sla, summary: ai.summary, priority: ai.priority };
  });

async function signMedia(admin: any, items: MediaItem[]): Promise<MediaItem[]> {
  if (!items?.length) return [];
  const { data } = await admin.storage.from("evidence").createSignedUrls(items.map((m) => m.path), 3600);
  return items.map((m, i) => ({ ...m, url: data?.[i]?.signedUrl }));
}

const trackSchema = z.object({ code: z.string().trim().toUpperCase().max(30), phone: z.string().trim().max(20) });

export const trackComplaint = createServerFn({ method: "POST" })
  .inputValidator((d) => trackSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("complaints")
      .select("*")
      .eq("code", data.code)
      .eq("phone", normPhone(data.phone))
      .maybeSingle();
    if (!c) return { found: false as const };
    const { data: events } = await supabaseAdmin
      .from("complaint_events")
      .select("status, note, actor, created_at")
      .eq("complaint_id", c.id)
      .order("created_at");
    return {
      found: true as const,
      complaint: {
        code: c.code!,
        village: c.village,
        description: c.description,
        category: c.category,
        department: c.department,
        ai_summary: c.ai_summary,
        priority: c.priority,
        status: c.status,
        sla_due: c.sla_due,
        created_at: c.created_at,
        action_taken: c.action_taken,
        resolution_notes: c.resolution_notes,
        citizen_confirmed: c.citizen_confirmed,
        media: await signMedia(supabaseAdmin, c.media as MediaItem[]),
        before_media: await signMedia(supabaseAdmin, c.before_media as MediaItem[]),
        after_media: await signMedia(supabaseAdmin, c.after_media as MediaItem[]),
      },
      events: events ?? [],
    };
  });

export const confirmResolution = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    trackSchema.extend({ confirmed: z.boolean(), feedback: z.string().trim().max(1000).optional().default("") }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("complaints")
      .select("id, status")
      .eq("code", data.code)
      .eq("phone", normPhone(data.phone))
      .maybeSingle();
    if (!c || c.status !== "resolved") throw new Error("This complaint cannot be confirmed right now.");
    const status = data.confirmed ? "closed" : "reopened";
    await supabaseAdmin
      .from("complaints")
      .update({ citizen_confirmed: data.confirmed, citizen_feedback: data.feedback || null, status })
      .eq("id", c.id);
    await supabaseAdmin.from("complaint_events").insert({
      complaint_id: c.id,
      status,
      note: data.confirmed
        ? `Citizen confirmed the issue is resolved${data.feedback ? `: ${data.feedback}` : ""}`
        : `Citizen says issue is NOT resolved${data.feedback ? `: ${data.feedback}` : ""}`,
      actor: "citizen",
    });
    return { ok: true, status };
  });
