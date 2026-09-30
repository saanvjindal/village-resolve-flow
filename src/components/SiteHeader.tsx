import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
            ग्रा
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-primary">Gram Sunwai</span>
            <span className="block text-xs text-muted-foreground">Village Grievance Portal</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link to="/report" className="rounded-full px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary" }}>
            Report
          </Link>
          <Link to="/track" className="rounded-full px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary" }}>
            Track
          </Link>
          <Link to="/dashboard" className="hidden rounded-full px-3 py-2 text-muted-foreground hover:bg-secondary sm:inline" activeProps={{ className: "bg-secondary text-primary" }}>
            Officials
          </Link>
        </nav>
      </div>
    </header>
  );
}
