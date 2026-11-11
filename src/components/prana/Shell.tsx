import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Compass, Play, Timer, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { to: "/", name: "Entdecken", icon: Compass },
  { to: "/learn", name: "Verstehen", icon: BookOpen },
  { to: "/practice", name: "Praktizieren", icon: Play },
] as const;

export function PranaShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const studio = pathname === "/timer";
  return <div className={studio ? "prana-studio-shell" : "prana-app"}>
    <header className="prana-app prana-header">
      <div className="prana-nav-inner">
        <Link to="/" className="prana-brand" aria-label="PRANA-XP Startseite">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M16 27C2 20 4 9 5 5c6 0 10 5 11 12C17 10 21 5 27 5c1 4 3 15-11 22Z"/><path d="M16 27C9 19 10 9 16 3c6 6 7 16 0 24Z"/></svg>
          <span>PRANA<span className="text-primary">–XP</span></span>
        </Link>
        <nav aria-label="Hauptnavigation" className="prana-nav">
          {navigation.map(({ to, name, icon: Icon }) => <Button key={to} asChild variant="ghost" className={`prana-nav-link ${to === "/" ? pathname === "/" ? "is-active" : "" : pathname.startsWith(to) ? "is-active" : ""}`}><Link to={to}><Icon className="size-4"/><span>{name}</span></Link></Button>)}
        </nav>
        <Button asChild variant="outline" className="prana-studio-link"><Link to="/timer"><Timer/><span>Timer-Studio</span><ArrowUpRight/></Link></Button>
      </div>
    </header>
    {children}
    {!studio && <footer className="prana-footer"><Link to="/" className="font-semibold">PRANA–XP</Link><span>Verstehen. Erleben. Selbst entdecken.</span><span>Mit Neugier, nicht mit Leistungsdruck.</span></footer>}
  </div>;
}