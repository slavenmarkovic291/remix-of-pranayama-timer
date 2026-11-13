import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Compass, Play, Library, Timer, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { to: "/", name: "Entdecken", icon: Compass },
  { to: "/learn", name: "Verstehen", icon: BookOpen },
  { to: "/practice", name: "Praktizieren", icon: Play },
  { to: "/pranayama", name: "Bibliothek", icon: Library },
] as const;

export function PranaShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const studio = pathname === "/timer";
  return <div className={studio ? "prana-studio-shell" : "prana-app"}>
    <header className="prana-app prana-header">
      <div className="prana-nav-inner">
        <Link to="/" className="prana-brand" aria-label="PRANA-XP Startseite">
          <img src="/icon-192.png" alt="" width="34" height="34" className="prana-logo"/>
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