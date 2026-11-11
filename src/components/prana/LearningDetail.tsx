import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUnit, type LearningUnit } from "@/lib/learning";
import { PillarMark } from "./PillarMark";

export function LearningDetail({ unit }: { unit: LearningUnit }) {
  const [stage, setStage] = useState(0);
  const [more, setMore] = useState(false);
  return <main className="prana-main prana-page learning-detail">
    <Button asChild variant="link" className="px-0"><Link to="/learn"><ArrowLeft/> Alle Einstiege</Link></Button>
    <div className={`unit-heading pillar-${unit.id}`}><div><div className="prana-eyebrow">{unit.number} / {unit.name.toUpperCase()}</div><h1>{unit.title}</h1><p>{unit.description}</p></div><PillarMark id={unit.id} className="unit-art"/></div>
    <div className="learning-tabs" role="tablist" aria-label="Lernschritte">{["Verstehen", "Erleben", "Erforschen"].map((label, i) => <Button key={label} variant="ghost" role="tab" aria-selected={stage === i} aria-controls="learning-panel" id={`learning-tab-${i}`} onClick={() => setStage(i)} className={stage === i ? "is-active" : ""}><span>0{i + 1}</span>{label}</Button>)}</div>
    <section id="learning-panel" role="tabpanel" aria-labelledby={`learning-tab-${stage}`} className="learning-panel">
      {stage === 0 && <><div className="prana-eyebrow">DIE ZENTRALE IDEE</div><h2>{unit.idea}</h2><p>{unit.example}</p><aside className="perspective-note"><span>{unit.perspective}</span><p>{unit.context}</p></aside><Button variant="ghost" aria-expanded={more} onClick={() => setMore(!more)} className="px-0">Mehr erfahren <ChevronDown/></Button>{more && <p className="deeper-text">{unit.deeper}</p>}<div className="mt-8"><Button onClick={() => setStage(1)}>Zur Erfahrung <ArrowRight/></Button></div></>}
      {stage === 1 && <><div className="prana-eyebrow"><Clock3 className="size-4"/> {unit.duration} MINUTEN · EINFACHER EINSTIEG</div><h2>{unit.question}</h2><ol className="instruction-list">{unit.instructions.map((text, i) => <li key={text}><span>0{i + 1}</span>{text}</li>)}</ol><Button asChild size="lg"><Link to="/practice/$unit" params={{ unit: unit.id }}>Praxis öffnen <ArrowRight/></Link></Button></>}
      {stage === 2 && <><div className="prana-eyebrow">DEINE BEOBACHTUNG ZÄHLT</div><h2>{unit.reflection}</h2><p>Du kannst die Frage einen Moment wirken lassen. Auch „Ich weiß es noch nicht“ ist eine mögliche Antwort.</p><div className="mt-8"><Button asChild variant="outline"><Link to="/practice/$unit" params={{ unit: unit.id }}>Noch einmal erleben <ArrowRight/></Link></Button></div></>}
    </section>
    <section className="connected-units"><h2>Alles steht in Verbindung.</h2><div>{unit.connections.map((id) => { const related = getUnit(id); return related && <Link key={id} to="/learn/$pillar" params={{ pillar: id }}><span>{related.name}</span>{related.title}<ArrowUpRightIcon/></Link>; })}</div></section>
  </main>;
}
function ArrowUpRightIcon() { return <ArrowRight className="size-4"/>; }