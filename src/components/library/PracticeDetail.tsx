import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Timer, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, FOOD_RULES, KINDS, LEVELS, MECHANICS, TRADITIONS, addPresetToStudio, practicePreset, type Practice } from "@/lib/library";

function Part({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return <details className="lib-part" open={open}><summary>{title}</summary><div>{children}</div></details>;
}

export function PracticeDetail({ practice: p }: { practice: Practice }) {
  const navigate = useNavigate();
  const cat = CATEGORIES.find((c) => c.id === p.category)!;
  const t = p.timer;
  const openTimer = () => { if (!t) return; addPresetToStudio(practicePreset({ ...p, timer: t })); void navigate({ to: "/timer" }); };
  return <main className="prana-main prana-page lib-detail">
    <Link to="/pranayama" className="lib-back"><ArrowLeft className="size-4"/> Bibliothek</Link>
    <div className="prana-eyebrow">{cat.letter} · {cat.name.toUpperCase()}</div>
    <h1>{p.name}</h1>
    {p.alt.length > 0 && <p className="lib-alt">{p.alt.join(" · ")}</p>}
    <p className="page-intro">{p.short}</p>
    <div className="lib-badges"><span>{LEVELS[p.level]}</span><span>{KINDS[p.kind]}</span><span>{TRADITIONS[p.tradition]}</span><span>{MECHANICS[p.mechanics]}</span>{p.hypKumbhaka && <span>Einer der 8 Kumbhakas (HYP 2.44)</span>}</div>
    {p.status === "incomplete" && <p className="lib-warning"><AlertTriangle className="size-4"/> Für diese Praktik liegt keine verlässliche vollständige Anleitung vor. Die Angaben sind bewusst lückenhaft.</p>}
    <div className="lib-timer">
      {t ? <><div><strong>Timer-Rhythmus</strong><span>{t.inhale} s ein{t.holdIn ? ` · ${t.holdIn} s halten` : ""} · {t.exhale} s aus{t.holdOut ? ` · ${t.holdOut} s halten` : ""} · {t.rounds} Runden{t.note ? ` — ${t.note}` : ""}</span></div>
        <Button onClick={openTimer}><Timer/> Im Timer-Studio öffnen</Button></>
        : <span>Für diese Praktik gibt es bewusst keine Timer-Verknüpfung.</span>}
    </div>
    {t && <p className="lib-note">Wird als neue Vorlage im Timer-Studio gespeichert. Deine aktuelle Routine bleibt unverändert.</p>}
    <Part title="Einführung" open><p>{p.intro}</p><p><strong>Herkunft:</strong> {p.origin}</p></Part>
    <Part title="Durchführung" open><ol>{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>{p.ratio && <p><strong>Verhältnis:</strong> {p.ratio}</p>}</Part>
    <Part title="Zweck"><p>{p.purpose}</p></Part>
    <Part title="Wirkungen – klar getrennt"><h3>Traditionell überliefert</h3><p>{p.traditional}</p><h3>Wissenschaftlich untersucht</h3><p>{p.science}</p><h3>Noch ungeklärt</h3><p>{p.unclear}</p></Part>
    <Part title="Beste Zeit"><p>{p.bestTime}</p></Part>
    <Part title="Ernährung & leerer Magen"><p>Empfohlener Abstand zum Essen vor der Praxis:</p><ul>{FOOD_RULES.map(([a, b]) => <li key={a}><strong>{a}:</strong> {b}</li>)}</ul>{p.foodNote && <p>{p.foodNote}</p>}</Part>
    <Part title="Voraussetzungen & Vorsicht" open><p><strong>Voraussetzungen:</strong> {p.prerequisites}</p><p className="lib-caution"><strong>Vorsicht:</strong> {p.cautions}</p></Part>
    <Part title="Quellen"><ul>{p.sources.map((s) => <li key={s}>{s}</li>)}</ul></Part>
    <p className="lib-note">Diese Inhalte ersetzen keine ärztliche Beratung und keine erfahrene Lehrkraft.</p>
  </main>;
}
