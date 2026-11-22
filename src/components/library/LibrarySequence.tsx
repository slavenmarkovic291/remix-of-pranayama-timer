import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ListOrdered, Play, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPractice } from "@/lib/library";
import { loadLibraryOrder, prepareLibrarySessions, saveLibraryOrder, type LibrarySession } from "@/lib/library-sequence";
import { reorder } from "@/lib/timer";
import { audio } from "@/lib/sound";
import { PracticeTimer } from "./PracticeTimer";

export function useLibraryOrder() {
  const [order, setOrder] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { setOrder(loadLibraryOrder()); setReady(true); }, []);
  return { order, setOrder, ready };
}

export function LibrarySequence({ order, onChange, ready }: { order: string[]; onChange: (ids: string[]) => void; ready: boolean }) {
  const [playing, setPlaying] = useState<LibrarySession[] | null>(null);
  const [status, setStatus] = useState("");
  const change = (ids: string[]) => { onChange(ids); setStatus(""); };
  const first = playing?.[0];
  return <section className="library-sequence" aria-label="Meine Praxisfolge">
    <div className="section-heading"><h2><ListOrdered className="size-5"/> Meine Praxisfolge</h2><span className="lib-count">{order.length} Praktiken</span></div>
    {order.length === 0 ? <p className="lib-note">Noch keine Praktiken ausgewählt.</p> : <ol className="library-sequence-list">{order.map((id, index) => {
      const p = getPractice(id); if (!p) return null;
      return <li key={`${id}-${index}`}><span className="sequence-position">{index + 1}</span><div><Link to="/pranayama/$id" params={{ id }}>{p.name}</Link>{p.status === "incomplete" && <p className="lib-note">Anleitung unvollständig</p>}</div><div className="sequence-row-actions">
        <Button variant="ghost" size="icon" disabled={index === 0} aria-label={`${p.name} nach oben · ${index + 1}`} title="Nach oben" onClick={() => change(reorder(order, index, -1))}><ArrowUp/></Button>
        <Button variant="ghost" size="icon" disabled={index === order.length - 1} aria-label={`${p.name} nach unten · ${index + 1}`} title="Nach unten" onClick={() => change(reorder(order, index, 1))}><ArrowDown/></Button>
        <Button variant="ghost" size="icon" aria-label={`${p.name} entfernen · ${index + 1}`} title="Entfernen" onClick={() => change(order.filter((_, i) => i !== index))}><Trash2/></Button>
      </div></li>;
    })}</ol>}
    <div className="sequence-actions"><Button disabled={!ready || order.length === 0} onClick={() => { audio(); setPlaying(prepareLibrarySessions(order)); }}><Play/> Folge starten</Button><Button variant="outline" disabled={!ready} onClick={() => setStatus(saveLibraryOrder(order) ? "Praxisfolge auf diesem Gerät gespeichert." : "Speichern nicht möglich.")}><Save/> Folge speichern</Button></div>
    <p className="lib-note">Es gelten die gespeicherten Zeiten jeder Praktik; ohne gespeicherte Zeiten gelten ihre Vorgaben.</p><p className="lib-note" role="status">{status}</p>
    {first && playing && <PracticeTimer practice={first.practice} sequence={playing} onSequenceClose={() => setPlaying(null)}/>}
  </section>;
}