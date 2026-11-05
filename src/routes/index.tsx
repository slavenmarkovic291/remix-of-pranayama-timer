import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Copy, Moon, Pause, Play, Plus, RotateCcw, Save, SkipBack, SkipForward, Sun, Trash2, TimerReset, FolderOpen, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  type Chain, type Signal, type TimerItem, type Unit, MAX_TIMERS, UNIT_LABEL, UNIT_MS, UNIT_ORDER,
  formatMs, joinMs, newId, splitMs,
} from "@/lib/timer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kettentimer – bis zu 50 Timer hintereinander" },
      { name: "description", content: "Multi-Timer mit sequenzieller Kette, Signalton, Vibration, Vorlagen und großer Anzeige." },
      { property: "og:title", content: "Kettentimer – bis zu 50 Timer hintereinander" },
      { property: "og:description", content: "Timer-Ketten mit 1-Klick-Start, Signal bei Ablauf und Vorlagen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const LS_CHAIN = "kt.chain";
const LS_PRESETS = "kt.presets";
const LS_UI = "kt.ui";

const defaultChain = (): Chain => ({
  name: "Meine Kette",
  signal: "beep",
  units: ["s"],
  timers: [
    { id: newId(), name: "Aufwärmen", ms: 30000 },
    { id: newId(), name: "Pause", ms: 10000 },
  ],
});

let audioCtx: AudioContext | null = null;
function beep() {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* ignore */ }
}
function fireSignal(s: Signal) {
  if (s === "beep" || s === "both") beep();
  if ((s === "vibrate" || s === "both") && "vibrate" in navigator) navigator.vibrate([300, 100, 300]);
}

function App() {
  const [chain, setChain] = useState<Chain>(defaultChain);
  const [presets, setPresets] = useState<Chain[]>([]);
  const [dark, setDark] = useState(true);
  const [fontSize, setFontSize] = useState(120);
  const [loaded, setLoaded] = useState(false);

  // run state
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const endRef = useRef(0);
  const chainRef = useRef(chain);
  chainRef.current = chain;

  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CHAIN);
      if (c) setChain(JSON.parse(c));
      const p = localStorage.getItem(LS_PRESETS);
      if (p) setPresets(JSON.parse(p));
      const u = localStorage.getItem(LS_UI);
      if (u) { const o = JSON.parse(u); setDark(o.dark ?? true); setFontSize(o.fontSize ?? 120); }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(LS_CHAIN, JSON.stringify(chain)); }, [chain, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem(LS_PRESETS, JSON.stringify(presets)); }, [presets, loaded]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (loaded) localStorage.setItem(LS_UI, JSON.stringify({ dark, fontSize }));
  }, [dark, fontSize, loaded]);

  // ticking
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      let rem = endRef.current - now;
      if (rem <= 0) {
        const c = chainRef.current;
        fireSignal(c.signal);
        setIndex((i) => {
          const next = i + 1;
          if (next >= c.timers.length) {
            setRunning(false); setFinished(true); setRemaining(0);
            return i;
          }
          // continue seamlessly from the exact end moment
          endRef.current = endRef.current + c.timers[next].ms;
          return next;
        });
        rem = Math.max(0, endRef.current - now);
      }
      setRemaining(rem);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // keep screen awake while running
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => { lock?.release().catch(() => {}); };
  }, [running]);

  const timers = chain.timers;
  const current = timers[index];
  const next = timers[index + 1];
  const shownRemaining = started ? remaining : (current?.ms ?? 0);
  const progress = current && current.ms > 0 ? 100 - (shownRemaining / current.ms) * 100 : 0;

  const jumpTo = useCallback((i: number, keepRunning: boolean) => {
    const t = chainRef.current.timers[i];
    if (!t) return;
    setIndex(i); setFinished(false); setRemaining(t.ms);
    endRef.current = performance.now() + t.ms;
    setRunning(keepRunning);
  }, []);

  const start = () => {
    if (!timers.length) return;
    try { audioCtx ??= new AudioContext(); audioCtx.resume(); } catch { /* ignore */ }
    if (!started || finished) { setStarted(true); jumpTo(0, true); return; }
    if (!running) { endRef.current = performance.now() + remaining; setRunning(true); }
  };
  const pause = () => { setRunning(false); setRemaining(endRef.current - performance.now()); };
  const resetAll = () => { setRunning(false); setStarted(false); setFinished(false); setIndex(0); };
  const resetCurrent = () => { if (started) jumpTo(index, running); };
  const skip = (d: number) => {
    const i = Math.min(Math.max(index + d, 0), timers.length - 1);
    if (!started) { setIndex(i); return; }
    jumpTo(i, running);
  };

  const update = (patch: Partial<Chain>) => setChain((c) => ({ ...c, ...patch }));
  const updateTimer = (id: string, patch: Partial<TimerItem>) =>
    update({ timers: timers.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const addTimer = () => timers.length < MAX_TIMERS &&
    update({ timers: [...timers, { id: newId(), name: "", ms: 30000 }] });
  const duplicate = (i: number) => {
    if (timers.length >= MAX_TIMERS) return;
    const copy = [...timers]; copy.splice(i + 1, 0, { ...timers[i], id: newId() });
    update({ timers: copy });
  };
  const remove = (i: number) => { update({ timers: timers.filter((_, k) => k !== i) }); if (index >= timers.length - 1) setIndex(0); };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= timers.length) return;
    const copy = [...timers]; [copy[i], copy[j]] = [copy[j], copy[i]];
    update({ timers: copy });
  };
  const toggleUnit = (u: Unit) => {
    const has = chain.units.includes(u);
    if (has && chain.units.length === 1) return;
    update({ units: has ? chain.units.filter((x) => x !== u) : [...chain.units, u] });
  };

  const savePreset = () => {
    const name = prompt("Name der Vorlage:", chain.name);
    if (!name) return;
    const p = { ...chain, name };
    update({ name });
    setPresets((ps) => [...ps.filter((x) => x.name !== name), p]);
  };
  const loadPreset = (p: Chain) => { resetAll(); setChain({ ...p, timers: p.timers.map((t) => ({ ...t, id: newId() })) }); };
  const renamePreset = (i: number) => {
    const name = prompt("Neuer Name:", presets[i].name);
    if (name) setPresets((ps) => ps.map((p, k) => (k === i ? { ...p, name } : p)));
  };

  const total = timers.reduce((a, t) => a + t.ms, 0);
  const activeUnits = UNIT_ORDER.filter((u) => chain.units.includes(u));

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">●</span> Kettentimer
        </h1>
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Design wechseln">
          {dark ? <Sun /> : <Moon />}
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Display */}
        <section className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Timer {timers.length ? index + 1 : 0} / {timers.length}</span>
              <span>{finished ? "Fertig ✓" : running ? "Läuft" : started ? "Pausiert" : "Bereit"}</span>
            </div>
            <div className="mt-2 truncate text-xl font-medium">{current?.name || `Timer ${index + 1}`}</div>
            <div
              className="my-4 text-center font-mono font-bold leading-none tabular-nums text-primary"
              style={{ fontSize: `clamp(2rem, ${fontSize / 6}vw, ${fontSize}px)` }}
            >
              {formatMs(shownRemaining, chain.units)}
            </div>
            <Progress value={progress} className="h-3" />
            <div className="mt-3 text-sm text-muted-foreground">
              Als Nächstes:{" "}
              <span className="font-medium text-foreground">
                {next ? `${next.name || `Timer ${index + 2}`} · ${formatMs(next.ms, chain.units)}` : "—"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              <Button variant="secondary" size="lg" onClick={() => skip(-1)} aria-label="Zurück"><SkipBack /></Button>
              {running ? (
                <Button size="lg" className="col-span-3 h-14 text-lg" onClick={pause}><Pause /> Pause</Button>
              ) : (
                <Button size="lg" className="col-span-3 h-14 text-lg" onClick={start} disabled={!timers.length}>
                  <Play /> {started && !finished ? "Fortsetzen" : "Start"}
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={() => skip(1)} aria-label="Weiter"><SkipForward /></Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={resetCurrent} disabled={!started}><TimerReset /> Timer neu</Button>
              <Button variant="outline" onClick={resetAll}><RotateCcw /> Kette zurücksetzen</Button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <div>
              <div className="mb-2 flex justify-between text-sm"><span>Schriftgröße</span><span className="text-muted-foreground">{fontSize}px</span></div>
              <Slider min={40} max={320} step={4} value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} />
            </div>
            <div>
              <div className="mb-2 text-sm">Zeiteinheiten</div>
              <div className="grid grid-cols-4 gap-2">
                {UNIT_ORDER.map((u) => (
                  <Button key={u} variant={chain.units.includes(u) ? "default" : "outline"} onClick={() => toggleUnit(u)}>
                    {UNIT_LABEL[u]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm">Signal bei Ablauf</div>
              <div className="grid grid-cols-4 gap-2">
                {([["beep", "Ton"], ["vibrate", "Vibration"], ["both", "Beides"], ["mute", "Stumm"]] as [Signal, string][]).map(([s, l]) => (
                  <Button key={s} size="sm" variant={chain.signal === s ? "default" : "outline"} onClick={() => update({ signal: s })}>{l}</Button>
                ))}
              </div>
              <Button variant="link" size="sm" className="px-0" onClick={() => fireSignal(chain.signal)}>Signal testen</Button>
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <Input value={chain.name} onChange={(e) => update({ name: e.target.value })} className="text-base font-medium" aria-label="Name der Kette" />
            <div className="mt-2 text-sm text-muted-foreground">
              {timers.length} / {MAX_TIMERS} Timer · Gesamt {formatMs(total, ["h", "m", "s"])}
            </div>
          </div>

          <ol className="space-y-2">
            {timers.map((t, i) => {
              const parts = splitMs(t.ms, chain.units);
              const active = started && i === index;
              return (
                <li key={t.id} className={`rounded-xl border bg-card p-3 ${active ? "border-primary ring-2 ring-primary/40" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</span>
                    <Input placeholder={`Timer ${i + 1}`} value={t.name} onChange={(e) => updateTimer(t.id, { name: e.target.value })} className="h-9" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-end gap-2 pl-8">
                    {activeUnits.map((u) => (
                      <label key={u} className="flex flex-col text-xs text-muted-foreground">
                        {UNIT_LABEL[u]}
                        <Input
                          type="number" inputMode="numeric" min={0}
                          className={`h-11 font-mono text-lg ${activeUnits.length === 1 ? "w-28" : "w-20"}`}
                          value={parts[u] ?? 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                            updateTimer(t.id, { ms: joinMs({ ...parts, [u]: v }) });
                          }}
                        />
                      </label>
                    ))}
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Nach oben"><ArrowUp /></Button>
                      <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === timers.length - 1} aria-label="Nach unten"><ArrowDown /></Button>
                      <Button variant="ghost" size="icon" onClick={() => duplicate(i)} disabled={timers.length >= MAX_TIMERS} aria-label="Duplizieren"><Copy /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Löschen" className="text-destructive"><Trash2 /></Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button className="h-12 w-full" variant="secondary" onClick={addTimer} disabled={timers.length >= MAX_TIMERS}>
            <Plus /> Timer hinzufügen
          </Button>

          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Vorlagen</h2>
              <Button size="sm" onClick={savePreset}><Save /> Speichern</Button>
            </div>
            {presets.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Vorlagen gespeichert.</p>}
            <ul className="space-y-2">
              {presets.map((p, i) => (
                <li key={p.name + i} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.timers.length} Timer</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => loadPreset(p)} aria-label="Laden"><FolderOpen /></Button>
                  <Button size="icon" variant="ghost" onClick={() => renamePreset(i)} aria-label="Umbenennen"><Pencil /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setPresets((ps) => ps.filter((_, k) => k !== i))} aria-label="Vorlage löschen"><Trash2 /></Button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

void UNIT_MS;
