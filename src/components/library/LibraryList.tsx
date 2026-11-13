import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Timer, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CATEGORIES, LEVELS, MECHANICS, RATIOS, RATIO_NOTE, TRADITIONS, filterPractices, practices } from "@/lib/library";

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <label className="lib-select"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}><option value="">Alle</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
}

export function LibraryList() {
  const [f, setF] = useState({ q: "", category: "", tradition: "", level: "", mechanics: "" });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const list = filterPractices(practices, f);
  return <main className="prana-main prana-page">
    <div className="prana-eyebrow">TRADITION · FORSCHUNG · EIGENE ERFAHRUNG</div>
    <h1>Pranayama-Bibliothek</h1>
    <p className="page-intro">{practices.length} Praktiken mit Herkunft, Anleitung und klar getrennten Aussagen aus Tradition und Forschung.</p>
    <div className="lib-filters">
      <label className="lib-search"><Search className="size-4"/><Input aria-label="Suchen" placeholder="Name oder Begriff suchen" value={f.q} onChange={(e) => set("q")(e.target.value)}/></label>
      <Select label="Kategorie" value={f.category} onChange={set("category")} options={CATEGORIES.map((c) => [c.id, `${c.letter} · ${c.name}`])}/>
      <Select label="Herkunft" value={f.tradition} onChange={set("tradition")} options={Object.entries(TRADITIONS)}/>
      <Select label="Stufe" value={f.level} onChange={set("level")} options={Object.entries(LEVELS)}/>
      <Select label="Atemmechanik" value={f.mechanics} onChange={set("mechanics")} options={Object.entries(MECHANICS)}/>
    </div>
    <p className="lib-count">{list.length} von {practices.length} Praktiken</p>
    {CATEGORIES.map((c) => { const items = list.filter((p) => p.category === c.id); return items.length ? <section key={c.id} className="lib-section">
      <h2><span>{c.letter}</span>{c.name}</h2>
      <div className="lib-grid">{items.map((p) => <Link key={p.id} to="/pranayama/$id" params={{ id: p.id }} className="lib-card">
        <div className="lib-card-top"><h3>{p.name}</h3>{p.timer && <Timer className="size-4" aria-label="Mit Timer"/>}</div>
        {p.alt[0] && <span className="lib-alt">{p.alt.join(" · ")}</span>}
        <p>{p.short}</p>
        <div className="lib-badges"><span>{LEVELS[p.level]}</span>{p.hypKumbhaka && <span>HYP-Kumbhaka</span>}{p.status === "incomplete" && <span className="is-warn"><AlertTriangle className="size-3"/> Unvollständig</span>}</div>
      </Link>)}</div>
    </section> : null; })}
    {list.length === 0 && <p className="lib-count">Keine Praktik passt zu diesen Filtern.</p>}
    <section className="lib-section"><h2><span>∶</span>Atemverhältnisse</h2><p className="page-intro">{RATIO_NOTE}</p>
      <div className="lib-grid">{RATIOS.map((r) => <div key={r.ratio} className="lib-card"><h3>{r.ratio}</h3><span className="lib-alt">{r.name}</span><p>{r.text}</p></div>)}</div></section>
  </main>;
}
