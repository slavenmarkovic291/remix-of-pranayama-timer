import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { practiceSnapshot, type LearningUnit } from "@/lib/learning";
import { formatMs } from "@/lib/timer";
import { audio, playFinale, playStep } from "@/lib/sound";
import { PillarMark } from "./PillarMark";

export function GuidedPractice({ unit }: { unit: LearningUnit }) {
  const duration = unit.duration * 60000;
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const end = useRef(0);
  const done = useRef(false);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      const left = Math.max(0, end.current - performance.now());
      setRemaining(left);
      if (left === 0) {
        if (!done.current) { done.current = true; playFinale("bowl", 0.35); }
        setRunning(false); setFinished(true); return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  const start = () => {
    audio();
    if (!started) { const snapshot = practiceSnapshot(unit); playStep(snapshot.sound, 0, snapshot.volume); }
    end.current = performance.now() + remaining;
    setStarted(true); setRunning(true);
  };
  const pause = () => { setRemaining(Math.max(0, end.current - performance.now())); setRunning(false); };
  const reset = () => { setRunning(false); setRemaining(duration); setStarted(false); setFinished(false); done.current = false; };
  return <main className="prana-main prana-page guided-page">
    <Button asChild variant="link" className="px-0"><Link to="/practice"><ArrowLeft/> Alle Übungen</Link></Button>
    <div className="guided-layout"><section><div className="prana-eyebrow">{unit.name.toUpperCase()} · {unit.duration} MINUTEN</div><h1>{unit.title}</h1><p className="page-intro">{unit.description}</p><ol className="instruction-list">{unit.instructions.map((text, i) => <li key={text}><span>0{i + 1}</span>{text}</li>)}</ol><p className="safety-note">Du kannst jederzeit pausieren oder aufhören. Wenn du dich unwohl fühlst, orientiere dich im Raum und beende die Übung.</p><Button asChild variant="link" className="px-0"><Link to="/learn/$pillar" params={{ pillar: unit.id }}>Die Idee hinter der Praxis <ArrowRight/></Link></Button></section>
    <section className={`guided-player pillar-${unit.id}`} aria-label="Praxis-Timer"><PillarMark id={unit.id} className={`guided-art ${running ? "is-running" : ""}`}/><span className="guided-status" role="status">{finished ? "Praxis beendet" : running ? "Ein Moment für dich" : started ? "Pausiert" : "Bereit, wenn du es bist"}</span><div className="guided-time">{formatMs(remaining, ["m", "s"])}</div><div className="guided-controls">{!finished && <Button size="lg" onClick={running ? pause : start}>{running ? <Pause/> : <Play/>}{running ? "Pause" : started ? "Fortsetzen" : "Praxis starten"}</Button>}<Button variant="outline" size="icon" aria-label="Praxis zurücksetzen" title="Praxis zurücksetzen" onClick={reset}><RotateCcw/></Button></div></section></div>
    {finished && <section className="practice-reflection"><div className="prana-eyebrow">ERFORSCHEN</div><h2>{unit.reflection}</h2><p>Nimm dir einen Moment, ohne deine Erfahrung bewerten zu müssen.</p><Button asChild variant="outline"><Link to="/learn/$pillar" params={{ pillar: unit.id }}>Weiter erkunden <ArrowRight/></Link></Button></section>}
  </main>;
}