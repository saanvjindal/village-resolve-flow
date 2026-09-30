import { Check } from "lucide-react";
import { STATUS_STEPS, STATUS_LABEL } from "@/lib/departments";
import { cn } from "@/lib/utils";

export function StatusTimeline({ status }: { status: string }) {
  const effective = status === "closed" ? "resolved" : status === "reopened" ? "in_progress" : status;
  const idx = STATUS_STEPS.indexOf(effective as (typeof STATUS_STEPS)[number]);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {STATUS_STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-1 flex-1", i === 0 ? "opacity-0" : done ? "bg-success" : "bg-border")} />
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                  done ? "border-success bg-success text-success-foreground" : "border-border bg-card text-muted-foreground",
                  i === idx && "ring-4 ring-success/25",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className={cn("h-1 flex-1", i === STATUS_STEPS.length - 1 ? "opacity-0" : i < idx ? "bg-success" : "bg-border")} />
            </div>
            <span className={cn("mt-2 text-xs sm:text-sm", done ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function MediaGrid({ items }: { items: { url?: string; type: string }[] }) {
  if (!items?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((m, i) =>
        !m.url ? null : m.type.startsWith("video") ? (
          <video key={i} src={m.url} controls className="aspect-video w-full rounded-lg bg-muted object-cover" />
        ) : (
          <a key={i} href={m.url} target="_blank" rel="noreferrer">
            <img src={m.url} alt="Evidence" className="aspect-square w-full rounded-lg bg-muted object-cover" />
          </a>
        ),
      )}
    </div>
  );
}
