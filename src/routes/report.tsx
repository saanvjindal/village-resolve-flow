import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Camera, Loader2, MapPin, CheckCircle2, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitComplaint } from "@/lib/grievance.functions";
import { CATEGORIES, type CategoryKey } from "@/lib/departments";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a problem — Gram Sunwai" },
      { name: "description", content: "Register a complaint about roads, water, electricity, sanitation, health, farming or schemes in your village." },
      { property: "og:title", content: "Report a problem — Gram Sunwai" },
      { property: "og:description", content: "Register a village complaint in two minutes. Get a complaint ID instantly." },
    ],
  }),
  component: ReportPage,
});

type Result = Awaited<ReturnType<typeof submitComplaint>>;

const toBase64 = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(f);
  });

function ReportPage() {
  const submit = useServerFn(submitComplaint);
  const [form, setForm] = useState({ name: "", phone: "", village: "", district: "", description: "", locationText: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const locate = () => {
    if (!navigator.geolocation) { toast.error("Location not available on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error("Could not get location. Please type the landmark instead.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 4);
    const big = next.find((f) => f.size > 15 * 1024 * 1024);
    if (big) { toast.error(`${big.name} is larger than 15 MB`); return; }
    setFiles(next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9+\- ]{10,15}$/.test(form.phone.trim())) { toast.error("Enter a valid 10-digit mobile number"); return; }
    if (form.description.trim().length < 10) { toast.error("Please describe the problem in a little more detail"); return; }
    setBusy(true);
    try {
      const payloadFiles = await Promise.all(files.map(async (f) => ({ name: f.name, type: f.type, base64: await toBase64(f) })));
      const r = await submit({
        data: { ...form, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null, files: payloadFiles },
      });
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const cat = CATEGORIES[result.category as CategoryKey];
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl bg-card p-6 text-center shadow-card sm:p-8">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-3xl font-bold">Complaint registered</h1>
          <p className="mt-1 text-muted-foreground">Save this complaint ID to track progress</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.code);
              toast.success("Copied");
            }}
            className="mx-auto mt-5 flex items-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-secondary px-5 py-3 font-display text-2xl font-extrabold tracking-wider text-primary"
          >
            {result.code} <Copy className="h-5 w-5" />
          </button>
          <div className="mt-6 space-y-3 rounded-2xl bg-muted p-4 text-left">
            <Row label="Problem type" value={`${cat.icon} ${cat.label}`} />
            <Row label="Sent to" value={result.department} />
            <Row label="Priority" value={result.priority} />
            <Row label="Action expected by" value={new Date(result.slaDue).toLocaleDateString("en-IN", { dateStyle: "long" })} />
            {result.summary && <p className="border-t border-border pt-3 text-sm text-muted-foreground">“{result.summary}”</p>}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/track" search={{ code: result.code }} className="rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground">
              Track this complaint
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
                setForm((f) => ({ ...f, description: "", locationText: "" }));
              }}
              className="rounded-2xl border border-border px-5 py-3 font-semibold"
            >
              Report another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">Report a problem</h1>
      <p className="mt-1 text-muted-foreground">You can write in Hindi, English or your own language.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <fieldset className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <legend className="font-display text-lg font-bold">1. Your details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" required><Input className="h-12 text-base" value={form.name} onChange={set("name")} required minLength={2} /></Field>
            <Field label="Mobile number" required><Input className="h-12 text-base" inputMode="tel" value={form.phone} onChange={set("phone")} required placeholder="10-digit number" /></Field>
            <Field label="Village" required><Input className="h-12 text-base" value={form.village} onChange={set("village")} required minLength={2} /></Field>
            <Field label="District / Block"><Input className="h-12 text-base" value={form.district} onChange={set("district")} /></Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <legend className="font-display text-lg font-bold">2. What is the problem?</legend>
          <Textarea
            className="min-h-36 text-base"
            value={form.description}
            onChange={set("description")}
            required
            placeholder="e.g. The handpump near the school has been broken for 2 weeks. 40 families have no drinking water."
          />
          <div>
            <Label className="mb-2 block">Photo or video (up to 4)</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input bg-muted px-4 py-6 font-semibold text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-6 w-6" /> Take photo / choose file
              <input type="file" accept="image/*,video/*" capture="environment" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {files.map((f, i) => (
                  <li key={i} className="relative overflow-hidden rounded-lg bg-muted">
                    {f.type.startsWith("image") ? (
                      <img src={URL.createObjectURL(f)} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="grid aspect-square place-items-center p-2 text-center text-xs">🎥 {f.name}</div>
                    )}
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background" aria-label="Remove">
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <legend className="font-display text-lg font-bold">3. Where is it?</legend>
          <button type="button" onClick={locate} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-4 font-bold text-secondary-foreground">
            {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
            {coords ? `Location captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "Use my current location"}
          </button>
          <Field label="Landmark / address"><Input className="h-12 text-base" value={form.locationText} onChange={set("locationText")} placeholder="e.g. Near primary school, ward 3" /></Field>
        </fieldset>

        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-5 text-lg font-extrabold text-accent-foreground shadow-card disabled:opacity-70">
          {busy ? (<><Loader2 className="h-5 w-5 animate-spin" /> Understanding your complaint…</>) : "Submit complaint"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold capitalize">{value}</span>
    </div>
  );
}
