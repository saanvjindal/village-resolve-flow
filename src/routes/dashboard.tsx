import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Officials dashboard — Gram Sunwai" },
      { name: "description", content: "Dashboard for government officials to manage village complaints." },
      { property: "og:title", content: "Officials dashboard — Gram Sunwai" },
      { property: "og:description", content: "Manage, update and resolve village complaints." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-primary">Officials dashboard</h1>
      <p className="mt-3 text-muted-foreground">The official sign-in and dashboard are coming soon.</p>
      <Link to="/" className="mt-6 inline-block font-bold text-primary hover:underline">Back home</Link>
    </main>
  );
}
