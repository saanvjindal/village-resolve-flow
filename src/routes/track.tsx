import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Search, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackComplaint, confirmResolution } from "@/lib/grievance.functions";
import { CATEGORIES, STATUS_LABEL, type CategoryKey } from "@/lib/departments";
import { StatusTimeline, MediaGrid } from "@/components/StatusTimeline";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ code: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Track your complaint — Gram Sunwai" },
      { name: "description", content: "Check the status of your village complaint using your complaint ID and mobile number." },
      { property: "og:title", content: "Track your complaint — Gram Sunwai" },
      { property: "og:description", content: "See every step from submission to resolution, with proof of work." },
    ],
  }),
  component: TrackPage,
});

type Data = Extract<Awaited<ReturnType<typeof trackComplaint>>, { found: true }>;

function TrackPage() {
  const search = Route.useSearch();
  const track = useServerFn(trackComplaint);
  const confirm = useServerFn(confirmResolution);
  const [code, setCode] = useState(search.code ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [feedback, setFeedback] = useState("");

  const load = async () => {
    setBusy(true);
    try {
      const r = await track({ data: { code, phone } });
      if (!r.found) {
        setData(null);
        toast.error("No complaint found. Check the ID and mobile number.");
      } else setData(r);
    } catch {
      toast.error("Could not load complaint");
    } finally {
      setBusy(false);
    }
  };

  const doConfirm = async (confirmed: boolean) => {
    try {
      await confirm({ data: { code, phone, confirmed, feedback } });
      toast.success(confirmed ? "Thank you for confirming!" : "Complaint reopened. Officials will look again.");
      setFeedback("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const c = data?.complaint;
  const cat = c ? CATEGORIES[c.category as CategoryKey] ?? CATEGORIES.other : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">Track your complaint</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mt-5 grid gap-3 rounded-2xl bg-card p-5 shadow-card sm:grid-cols-[1fr_1fr_auto]"
      >
        <Input className="h-12 text-base uppercase" placeholder="GRV-2026-004821" value={code} onChange={(e) => setCode(e.target.value)} required />
        <Input className="h-12 text-base" inputMode="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />} Check
        </button>
      </form>

      {c && cat && (
        <div className="mt-6 space-y-5">
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl font-extrabold tracking-wide text-primary">{c.code}</p>
                <p className="text-sm text-muted-foreground">
                  {cat.icon} {cat.label} · {c.department}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{STATUS_LABEL[c.status]}</span>
            </div>
            <div className="mt-6">
              <StatusTimeline status={c.status} />
            </div>
            {c.sla_due && !["resolved", "closed"].includes(c.status) && (
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Action expected by <b className="text-foreground">{new Date(c.sla_due).toLocaleDateString("en-IN", { dateStyle: "long" })}</b>
              </p>
            )}
          </section>

          {c.status === "resolved" && c.citizen_confirmed === null && (
            <section className="rounded-2xl border-2 border-accent bg-card p-5 shadow-card">
              <h2 className="text-xl font-bold">Is the problem really fixed?</h2>
              <p className="text-sm text-muted-foreground">Please check the proof below and tell us.</p>
              <Textarea className="mt-3" placeholder="Optional comment" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button onClick={() => doConfirm(true)} className="flex items-center justify-center gap-2 rounded-xl bg-success py-4 font-bold text-success-foreground">
                  <ThumbsUp className="h-5 w-5" /> Yes, fixed
                </button>
                <button onClick={() => doConfirm(false)} className="flex items-center justify-center gap-2 rounded-xl bg-destructive py-4 font-bold text-destructive-foreground">
                  <ThumbsDown className="h-5 w-5" /> Not fixed
                </button>
              </div>
            </section>
          )}

          {(c.action_taken || c.after_media.length > 0) && (
            <section className="rounded-2xl bg-card p-5 shadow-card">
              <h2 className="text-xl font-bold">Proof of resolution</h2>
              {c.action_taken && <p className="mt-2"><b>Action taken:</b> {c.action_taken}</p>}
              {c.resolution_notes && <p className="mt-1 text-muted-foreground">{c.resolution_notes}</p>}
              {c.before_media.length > 0 && (<><p className="mb-2 mt-4 text-sm font-semibold">Before</p><MediaGrid items={c.before_media} /></>)}
              {c.after_media.length > 0 && (<><p className="mb-2 mt-4 text-sm font-semibold">After</p><MediaGrid items={c.after_media} /></>)}
            </section>
          )}

          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="text-xl font-bold">Your complaint</h2>
            <p className="mt-2 whitespace-pre-wrap">{c.description}</p>
            <div className="mt-3"><MediaGrid items={c.media} /></div>
          </section>

          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="text-xl font-bold">History</h2>
            <ol className="mt-3 space-y-3 border-l-2 border-border pl-4">
              {data!.events.map((e, i) => (
                <li key={i}>
                  <p className="text-sm font-bold">{STATUS_LABEL[e.status]}</p>
                  <p className="text-sm">{e.note}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </main>
  );
}
