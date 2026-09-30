import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Megaphone, Search, Sparkles, Building2, UserCheck, CheckCircle2 } from "lucide-react";
import hero from "@/assets/village-hero.jpg";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/departments";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gram Sunwai — Report village problems, get them fixed" },
      { name: "description", content: "Report road, water, electricity and other village problems. Your complaint reaches the right government office automatically." },
      { property: "og:title", content: "Gram Sunwai — Report village problems, get them fixed" },
      { property: "og:description", content: "Your complaint reaches the right government office automatically. Track it until resolved." },
    ],
  }),
  component: Index,
});

const FLOW = [
  { icon: Megaphone, title: "You report", text: "Describe the problem, add a photo and location." },
  { icon: Sparkles, title: "AI understands", text: "It detects the type of problem automatically." },
  { icon: Building2, title: "Right department", text: "Sent directly to the responsible office." },
  { icon: UserCheck, title: "Official acts", text: "Work is done within a fixed deadline." },
  { icon: CheckCircle2, title: "You confirm", text: "See proof and confirm it is really fixed." },
];

function Index() {
  return (
    <main>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
              आपकी आवाज़, सही दफ़्तर तक
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Report a village problem. We make sure the right office fixes it.
            </h1>
            <p className="mt-4 max-w-lg text-lg opacity-90">
              Broken road, no water, power cut, garbage, health centre closed — tell us once, and track it until it's solved.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/report" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-lg font-bold text-accent-foreground shadow-card transition hover:brightness-105">
                <Megaphone className="h-5 w-5" /> Report a problem
              </Link>
              <Link to="/track" className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary-foreground/40 px-6 py-4 text-lg font-bold hover:bg-primary-foreground/10">
                <Search className="h-5 w-5" /> Track my complaint
              </Link>
            </div>
          </div>
          <img src={hero} alt="Indian village with road, handpump and fields" width={1280} height={960} className="w-full rounded-3xl border-4 border-primary-foreground/15 object-cover shadow-2xl" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold text-primary">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FLOW.map((f, i) => (
            <li key={f.title} className="relative rounded-2xl bg-card p-5 shadow-card">
              <span className="absolute right-4 top-3 font-display text-3xl font-extrabold text-secondary">{i + 1}</span>
              <f.icon className="h-8 w-8 text-accent" />
              <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="paper-texture border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl font-bold text-primary">Where your complaint goes</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_KEYS.map((k) => (
              <div key={k} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
                <span className="text-3xl">{CATEGORIES[k].icon}</span>
                <div>
                  <p className="font-bold">{CATEGORIES[k].label}</p>
                  <p className="text-sm text-muted-foreground">{CATEGORIES[k].department}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">Action within {CATEGORIES[k].slaDays} days</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/report" className="mt-10 inline-flex items-center gap-2 font-bold text-primary hover:underline">
            Start a complaint <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        Gram Sunwai · For officials: <Link to="/dashboard" className="font-semibold text-primary hover:underline">sign in to dashboard</Link>
      </footer>
    </main>
  );
}
