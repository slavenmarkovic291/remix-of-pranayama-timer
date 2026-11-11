import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Clock3, Sparkles, BookOpen, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { units, type LearningUnit } from "@/lib/learning";
import { PillarMark } from "./PillarMark";
import forest from "@/assets/awareness-forest.jpg";

export function PillarCard({ unit, practice = false }: { unit: LearningUnit; practice?: boolean }) {
  return <Link to={practice ? "/practice/$unit" : "/learn/$pillar"} params={practice ? { unit: unit.id } : { pillar: unit.id }} className={`pillar-card pillar-${unit.id}`}>
    <div className="flex items-center justify-between"><span className="pillar-number">{unit.number} / {unit.english}</span><ArrowUpRight className="size-4"/></div>
    <PillarMark id={unit.id} className="pillar-art"/>
    <h3>{practice ? unit.title : unit.name}</h3>
    <p>{unit.description}</p>
    <div className="pillar-bottom"><span>{practice ? <><Clock3 className="size-3.5"/> {unit.duration} Min · Geführter Einstieg</> : "Verstehen · Erleben · Erforschen"}</span><ArrowRight className="size-4"/></div>
  </Link>;
}

export function HomeScreen() {
  return <main className="prana-main">
    <section className="prana-welcome">
      <div className="prana-eyebrow"><span className="small-diamond"/> EIN RAUM FÜR DEINE AUFMERKSAMKEIT</div>
      <div className="welcome-row"><h1>PRANA-XP<span>Entdecke, was du wahrnimmst.</span></h1><p>Körper, Atem, Sinne und Innenwelt.<br/>Vier Zugänge zu deiner Erfahrung.<br/>Ein Weg, der bei dir beginnt.</p></div>
    </section>
    <section className="prana-feature">
      <img src={forest} alt="Farne und Moos an einem klaren, ruhigen Waldbach" width={1536} height={1024}/>
      <div className="feature-shade"/>
      <div className="feature-content"><span className="feature-label">DEIN ERSTER MOMENT</span><h2>Erst ankommen.<br/>Dann entdecken.</h2><p>Spüre den Boden unter dir.<br/>Du brauchst nichts zu erreichen.</p><Button asChild size="lg"><Link to="/learn/$pillar" params={{ pillar: "body" }}>Mit dem Körper beginnen <ArrowRight/></Link></Button><span className="feature-duration"><Clock3 className="size-3.5"/> 2 Minuten Praxis · Ohne Vorkenntnisse</span></div>
      <div className="feature-caption">01 — KONTAKT & KÖRPERWAHRNEHMUNG</div>
    </section>
    <section className="prana-section">
      <div className="section-heading"><div><div className="prana-eyebrow">VIER PERSPEKTIVEN. EINE ERFAHRUNG.</div><h2>Wo möchtest du beginnen?</h2></div><Button asChild variant="link"><Link to="/learn">Alle Einstiege <ArrowRight/></Link></Button></div>
      <div className="pillar-grid">{units.map((unit) => <PillarCard key={unit.id} unit={unit}/>)}</div>
    </section>
    <section className="learning-path"><div><span className="prana-eyebrow">DEIN EIGENER WEG</span><h2>Wissen wird lebendig,<br/>wenn du es selbst erkundest.</h2></div><ol>{[{ icon: BookOpen, title: "Verstehen", text: "Eine Idee kennenlernen." }, { icon: Sparkles, title: "Erleben", text: "In einer kurzen Praxis erfahren." }, { icon: ArrowUpRight, title: "Erforschen", text: "Deine eigenen Fragen stellen." }].map(({ icon: Icon, title, text }, i) => <li key={title}><span className="path-step">0{i + 1}</span><Icon className="size-5"/><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
    <section className="studio-band"><Timer className="size-7"/><div><h2>Deine Praxis. Dein Rhythmus.</h2><p>Der Pranayama Timer für deine eigenen Routinen.</p></div><Button asChild variant="outline"><Link to="/timer">Timer-Studio öffnen <ArrowUpRight/></Link></Button></section>
  </main>;
}

export function LearnScreen() {
  return <main className="prana-main prana-page"><div className="prana-eyebrow">VERSTEHEN → ERLEBEN → ERFORSCHEN</div><h1>Vier Zugänge. Dein Einstieg.</h1><p className="page-intro">Eine kurze Idee, eine eigene Erfahrung, eine offene Frage.<br/>Du entscheidest, wo deine Neugier dich hinführt.</p><div className="pillar-grid">{units.map((unit) => <PillarCard key={unit.id} unit={unit}/>)}</div><section className="evidence-note"><BookOpen className="size-5"/><div><h2>Wissen hat unterschiedliche Perspektiven.</h2><p>Wissenschaftliche Erkenntnisse, yogische Tradition und persönliche Untersuchung sind nicht dasselbe. In jeder Einheit benennen wir die Perspektive — ohne dir eine Erfahrung vorzuschreiben.</p></div></section></main>;
}

export function PracticeScreen() {
  return <main className="prana-main prana-page"><div className="prana-eyebrow">EIN MOMENT DIREKTER ERFAHRUNG</div><h1>Zeit für deine Praxis.</h1><p className="page-intro">Vier einfache Übungen zum Ankommen und Beobachten.<br/>Ohne Leistungsziel. In deinem eigenen Tempo.</p><div className="pillar-grid">{units.map((unit) => <PillarCard key={unit.id} unit={unit} practice/>)}</div><section className="studio-band"><Timer className="size-7"/><div><h2>Eine eigene Routine üben?</h2><p>Blöcke, Atemkreis, Klänge und deine gespeicherten Vorlagen.</p></div><Button asChild variant="outline"><Link to="/timer">Zum Pranayama Timer <ArrowUpRight/></Link></Button></section></main>;
}