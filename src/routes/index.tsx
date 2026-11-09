import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Copy, Moon, Pause, Play, Plus, RotateCcw, Save, SkipBack, SkipForward, Sun, Trash2,
  TimerReset, Pencil, Maximize, X, Infinity as InfinityIcon, ChevronDown, ChevronRight, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type Block, type Chain, type Cue, type FullChain, type Signal, type TimerItem, type TimerCue, type PresetAction, type Unit, ACCENTS, MAX_BLOCKS, MAX_TIMERS,
  UNIT_LABEL, UNIT_ORDER, blockJump, combinePreset, reorder, resolveTimerSignal, firstPos, fitCqw, formatMs, joinMs, newId, nextPos, splitMs, withDefaults,
} from "@/lib/timer";
import { type FinaleSound, STEP_SOUNDS, FINALE_SOUNDS, audio, playFinale, playStep, playWarn, speak, vibrate } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pranayama Timer – Atem-Routinen in Blöcken" },
      { name: "description", content: "Pranayama- und Atem-Timer mit bis zu 30 Blöcken, Runden, Sprachansage, Klangschale und Offline-Modus." },
      { property: "og:title", content: "Pranayama Timer – Atem-Routinen in Blöcken" },
      { property: "og:description", content: "Atem-Routinen aus Blöcken mit eigenen Runden, Sprachansage und ablenkungsfreiem Vollbild." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const LS_CHAIN = "kt.chain";
const LS_PRESETS = "kt.presets";
const LS_UI = "kt.ui";
const PREP_MS = 3000;

type FsMode = "numbers" | "bar" | "both";
interface Ui { dark: boolean; fontSize: number; accent: string; fsMode: FsMode; showName: boolean; showRound: boolean; showBlock: boolean; autoFs: boolean }
const UI_DEFAULTS: Ui = { dark: true, fontSize: 120, accent: "amber", fsMode: "both", showName: true, showRound: true, showBlock: true, autoFs: false };

const defaultChain = (): FullChain => withDefaults({
  name: "Meine Routine",
  signal: "beep",
  units: ["s"],
  blocks: [{
    id: newId(), name: "Atemsequenz", rounds: 7, open: true, timers: [
      { id: newId(), name: "Einatmen", ms: 6000 },
      { id: newId(), name: "Halten", ms: 3000 },
      { id: newId(), name: "Ausatmen", ms: 7000 },
      { id: newId(), name: "Halten", ms: 3000 },
    ],
  }],
});

function timerSignal(c: FullChain, t: TimerItem | undefined, i: number) {
  const signal = resolveTimerSignal(c, t);
  if (signal.tone) playStep(c.sound, i, c.volume);
  if (signal.vibration) vibrate([300, 100, 300]);
  if (signal.voice) speak(t?.name || `Timer ${i + 1}`, c.volume);
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

function Choice<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length > 4 ? 3 : options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, l]) => (
        <Button key={v} size="sm" variant={value === v ? "default" : "outline"} onClick={() => onChange(v)} className="px-1 text-xs">{l}</Button>
      ))}
    </div>
  );
}

function App() {
  const [chain, setChain] = useState<FullChain>(defaultChain);
  const [presets, setPresets] = useState<Chain[]>([]);
  const [ui, setUi] = useState<Ui>(UI_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [fs, setFs] = useState(false);
  const [presetError, setPresetError] = useState("");

  // run state
  const [blockIdx, setBlockIdx] = useState(0);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [prepping, setPrepping] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const endRef = useRef(0);
  const indexRef = useRef(0);
  const blockRef = useRef(0);
  const roundRef = useRef(1);
  const prepRef = useRef(false);
  const warnRef = useRef("");
  const chainRef = useRef(chain);
  chainRef.current = chain;

  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CHAIN);
      if (c) setChain(withDefaults(JSON.parse(c)));
      const p = localStorage.getItem(LS_PRESETS);
      if (p) setPresets(JSON.parse(p));
      const u = localStorage.getItem(LS_UI);
      if (u) setUi({ ...UI_DEFAULTS, ...JSON.parse(u) });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(LS_CHAIN, JSON.stringify(chain)); }, [chain, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem(LS_PRESETS, JSON.stringify(presets)); }, [presets, loaded]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", ui.dark);
    const a = ACCENTS.find((x) => x.id === ui.accent) ?? ACCENTS[0];
    root.style.setProperty("--primary", a.color);
    root.style.setProperty("--ring", a.color);
    root.style.setProperty("--primary-foreground", a.fg);
    if (loaded) localStorage.setItem(LS_UI, JSON.stringify(ui));
  }, [ui, loaded]);
  const setU = (p: Partial<Ui>) => setUi((u) => ({ ...u, ...p }));

  // ticking
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      let rem = endRef.current - now;
      while (rem <= 0) {
        const c = chainRef.current;
        if (prepRef.current) {
          prepRef.current = false;
          setPrepping(false);
          const t0 = c.blocks[blockRef.current]?.timers[indexRef.current];
          endRef.current += t0?.ms ?? 0;
          timerSignal(c, t0, indexRef.current);
          rem = endRef.current - now;
          continue;
        }
        const n = nextPos(c.blocks, { block: blockRef.current, round: roundRef.current, index: indexRef.current }, c.infinite);
        if (!n) {
          if (c.finale && c.signal !== "mute") playFinale(c.finaleSound, c.volume);
          setRunning(false); setFinished(true); setRemaining(0);
          return;
        }
        // Advance once outside React state updaters, which may be replayed.
        indexRef.current = n.index;
        roundRef.current = n.round;
        blockRef.current = n.block;
        const nt = c.blocks[n.block]?.timers[n.index];
        if (!nt) { setRunning(false); return; }
        endRef.current += nt.ms;
        timerSignal(c, nt, n.index);
        setIndex(n.index); setRound(n.round); setBlockIdx(n.block);
        rem = endRef.current - now;
      }
      // 3-2-1 pre-warning (always during the prep countdown)
      const c = chainRef.current;
      const sec = Math.ceil(rem / 1000);
      if ((prepRef.current || c.warn) && sec <= 3 && c.signal !== "mute") {
        const key = `${prepRef.current ? "p" : roundRef.current}-${indexRef.current}-${sec}`;
        const stepMs = prepRef.current ? PREP_MS : c.blocks[blockRef.current]?.timers[indexRef.current]?.ms ?? 0;
        if (warnRef.current !== key && sec >= 1 && (prepRef.current || stepMs > 3000)) {
          warnRef.current = key;
          playWarn(c.volume);
        }
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

  const blocks = chain.blocks;
  const block = blocks[blockIdx] ?? blocks[0];
  const safeBlock = block ?? { id: "", name: "", timers: [], rounds: 1 };
  const timers = safeBlock.timers;
  const rounds = Math.max(1, safeBlock.rounds);
  const current = timers[index];
  const np = nextPos(blocks, { block: blockIdx, round, index }, chain.infinite);
  const next = np ? blocks[np.block]?.timers[np.index] : undefined;
  const totalTimers = blocks.reduce((a, b) => a + b.timers.length, 0);
  const infiniteRounds = chain.infinite && blocks.length === 1;
  const stepMs = prepping ? PREP_MS : (current?.ms ?? 0);
  const shownRemaining = started ? remaining : (current?.ms ?? 0);
  const frac = stepMs > 0 ? Math.max(0, Math.min(1, shownRemaining / stepMs)) : 0;
  const roundLabel = infiniteRounds ? `Runde ${round}` : `Runde ${round} von ${rounds}`;
  const blockLabel = blocks.length > 1 ? `Block ${blockIdx + 1}/${blocks.length}` : "";
  const fsInfo = [ui.showBlock && blockLabel, ui.showRound && (infiniteRounds ? `Runde ${round}` : `Runde ${round}/${rounds}`)].filter(Boolean).join(" • ");
  const display = prepping ? String(Math.ceil(remaining / 1000)) : formatMs(shownRemaining, chain.units);
  const title = prepping ? "Bereit machen…" : (current?.name || `Timer ${index + 1}`);

  const enterFs = () => {
    setFs(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const exitFs = () => {
    setFs(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };
  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) setFs(false); };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const jumpTo = useCallback((i: number, keepRunning: boolean, b = blockRef.current) => {
    const t = chainRef.current.blocks[b]?.timers[i];
    if (!t) return;
    indexRef.current = i;
    blockRef.current = b; setBlockIdx(b);
    prepRef.current = false; setPrepping(false);
    setIndex(i); setFinished(false); setRemaining(t.ms);
    endRef.current = performance.now() + t.ms;
    warnRef.current = "";
    window.speechSynthesis?.cancel();
    if (keepRunning) timerSignal(chainRef.current, t, i);
    setRunning(keepRunning);
  }, []);

  const start = () => {
    const fp = blockJump(blocks, blockIdx, 0) ?? firstPos(blocks);
    if (!fp) return;
    audio();
    if (!started || finished) {
      setStarted(true);
      roundRef.current = 1; setRound(1);
      if (ui.autoFs) enterFs();
      if (chain.prep) {
        indexRef.current = 0; setIndex(0); setFinished(false);
        blockRef.current = fp.block; setBlockIdx(fp.block);
        prepRef.current = true; setPrepping(true);
        endRef.current = performance.now() + PREP_MS;
        setRemaining(PREP_MS);
        setRunning(true);
      } else { jumpTo(0, true, fp.block); }
      return;
    }
    if (!running) {
      endRef.current = performance.now() + remaining;
      if (!prepping && remaining === current?.ms) timerSignal(chain, current, index);
      setRunning(true);
    }
  };
  const pause = () => { setRunning(false); setRemaining(endRef.current - performance.now()); };
  const toggleRun = () => (running ? pause() : start());
  const resetAll = () => {
    setRunning(false); setStarted(false); setFinished(false); setIndex(0); setRound(1); setBlockIdx(0);
    prepRef.current = false; setPrepping(false); roundRef.current = 1; blockRef.current = 0; indexRef.current = 0; warnRef.current = "";
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };
  const resetCurrent = () => { if (started) jumpTo(index, running); };
  const skip = (d: number) => {
    const i = Math.min(Math.max(index + d, 0), timers.length - 1);
    if (!started) { setIndex(i); return; }
    jumpTo(i, running);
  };

  const navigateBlock = (direction: -1 | 0 | 1) => {
    const destination = blockJump(blocks, blockIdx, direction);
    if (!destination) return;
    roundRef.current = 1; setRound(1);
    jumpTo(destination.index, running, destination.block);
  };

  // tap / double-tap in fullscreen
  const tapRef = useRef<number | null>(null);
  const onFsTap = () => {
    if (tapRef.current) {
      clearTimeout(tapRef.current); tapRef.current = null;
      exitFs();
      return;
    }
    tapRef.current = window.setTimeout(() => { tapRef.current = null; toggleRun(); }, 280);
  };

  const update = (patch: Partial<FullChain>) => setChain((c) => ({ ...c, ...patch }));
  const updateBlock = (bi: number, patch: Partial<Block>) =>
    setChain((c) => ({ ...c, blocks: c.blocks.map((b, k) => (k === bi ? { ...b, ...patch } : b)) }));
  const setTimers = (bi: number, fn: (t: TimerItem[]) => TimerItem[]) =>
    setChain((c) => ({ ...c, blocks: c.blocks.map((b, k) => (k === bi ? { ...b, timers: fn(b.timers) } : b)) }));
  const updateTimer = (bi: number, id: string, patch: Partial<TimerItem>) =>
    setTimers(bi, (ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const addTimer = (bi: number) => setTimers(bi, (ts) => ts.length < MAX_TIMERS ? [...ts, { id: newId(), name: "", ms: 30000 }] : ts);
  const duplicate = (bi: number, i: number) => setTimers(bi, (ts) => {
    if (ts.length >= MAX_TIMERS) return ts;
    const copy = [...ts]; copy.splice(i + 1, 0, { ...ts[i]!, id: newId() }); return copy;
  });
  const remove = (bi: number, i: number) => {
    setTimers(bi, (ts) => ts.filter((_, k) => k !== i));
    if (bi === blockIdx && index >= timers.length - 1) setIndex(0);
  };
  const move = (bi: number, i: number, d: number) => setTimers(bi, (ts) => {
    const j = i + d; if (j < 0 || j >= ts.length) return ts;
    const copy = [...ts]; [copy[i], copy[j]] = [copy[j]!, copy[i]!]; return copy;
  });
  const addBlock = () => blocks.length < MAX_BLOCKS && update({
    blocks: [...blocks.map((b) => ({ ...b, open: false })), { id: newId(), name: `Block ${blocks.length + 1}`, rounds: 1, open: true, timers: [{ id: newId(), name: "", ms: 30000 }] }],
  });
  const removeBlock = (bi: number) => {
    if (blocks.length <= 1) return;
    resetAll(); update({ blocks: blocks.filter((_, k) => k !== bi) });
  };
  const moveBlock = (bi: number, d: number) => {
    const j = bi + d; if (j < 0 || j >= blocks.length) return;
    resetAll();
    const copy = [...blocks]; [copy[bi], copy[j]] = [copy[j]!, copy[bi]!]; update({ blocks: copy });
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
  const loadPreset = (p: Chain, action: PresetAction) => {
    const combined = combinePreset(chain, p, action);
    if (!combined) { setPresetError(`Maximal ${MAX_BLOCKS} Blöcke: Die Vorlage passt nicht vollständig in die Routine.`); return; }
    resetAll(); setPresetError(""); setChain(combined);
  };
  const renamePreset = (i: number) => {
    const name = prompt("Neuer Name:", presets[i]?.name);
    if (name) setPresets((ps) => ps.map((p, k) => (k === i ? { ...p, name } : p)));
  };
  const testSound = () => {
    audio();
    timerSignal(chain, undefined, 0);
  };

  const blockTotal = (b: Block) => b.timers.reduce((a, t) => a + t.ms, 0) * Math.max(1, b.rounds);
  const total = blocks.reduce((a, b) => a + blockTotal(b), 0);
  const activeUnits = UNIT_ORDER.filter((u) => chain.units.includes(u));
  const fsNumbers = ui.fsMode !== "bar";
  const fsBar = ui.fsMode !== "numbers";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {fs && (
        <div
          className="fixed inset-0 z-50 flex select-none flex-col items-center justify-center gap-6 bg-background p-6"
          onClick={onFsTap}
          role="button"
          aria-label="Vollbild: tippen für Pause, doppelt tippen zum Verlassen"
        >
          <button
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground/60 hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); exitFs(); }}
            aria-label="Vollbild schließen"
          >
            <X className="size-5" />
          </button>
          {fsInfo && started && !prepping && (
            <div className="text-base tracking-widest text-muted-foreground/80">{fsInfo}</div>
          )}
          {ui.showName && (
            <div className="max-w-full truncate text-center text-4xl font-bold sm:text-6xl">{title}</div>
          )}
          {(fsNumbers || prepping) && (
            <div className="w-full text-center [container-type:inline-size]">
              <div
                className="whitespace-nowrap font-mono font-bold leading-none tabular-nums text-primary"
                style={{ fontSize: `min(${Math.max(ui.fontSize, 160) / 4}vw, 40vh, ${fitCqw(display.length)}cqw)` }}
              >
                {display}
              </div>
            </div>
          )}
          {fsBar && !prepping && (
            <div className="h-4 w-full max-w-4xl overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${frac * 100}%` }} />
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {finished ? "Fertig ✓" : running ? "" : started ? "Pausiert – tippen zum Fortsetzen" : "Tippen zum Starten"}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">●</span> Pranayama Timer
        </h1>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={enterFs} aria-label="Vollbild"><Maximize /></Button>
          <Button variant="ghost" size="icon" onClick={() => setU({ dark: !ui.dark })} aria-label="Design wechseln">
            {ui.dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Display */}
        <section className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{blockLabel && `${blockLabel} · `}Timer {timers.length ? index + 1 : 0} / {timers.length} · {roundLabel}</span>
              <span>{finished ? "Fertig ✓" : prepping ? "Vorlauf" : running ? "Läuft" : started ? "Pausiert" : "Bereit"}</span>
            </div>
            <div className="mt-2 truncate text-xl font-medium">{title}</div>
            {blocks.length > 1 && <div className="truncate text-xs text-muted-foreground">{safeBlock.name}</div>}
            <div className="my-4 [container-type:inline-size]">
              <div
                className="whitespace-nowrap text-center font-mono font-bold leading-none tabular-nums text-primary"
                style={{ fontSize: `min(${ui.fontSize}px, ${fitCqw(display.length)}cqw)` }}
              >
                {display}
              </div>
            </div>
            <Progress value={100 - frac * 100} className="h-3" />
            <div className="mt-3 text-sm text-muted-foreground">
              Als Nächstes:{" "}
              <span className="font-medium text-foreground">
                {next ? `${next.name || "Timer"} · ${formatMs(next.ms, chain.units)}` : "—"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              <Button variant="secondary" size="lg" onClick={() => skip(-1)} aria-label="Zurück"><SkipBack /></Button>
              {running ? (
                <Button size="lg" className="col-span-3 h-14 text-lg" onClick={pause}><Pause /> Pause</Button>
              ) : (
                <Button size="lg" className="col-span-3 h-14 text-lg" onClick={start} disabled={!totalTimers}>
                  <Play /> {started && !finished ? "Fortsetzen" : "Start"}
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={() => skip(1)} aria-label="Weiter"><SkipForward /></Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">Blöcke</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="icon" title="Vorheriger Block" aria-label="Vorheriger Block" disabled={!blockJump(blocks, blockIdx, -1)} onClick={() => navigateBlock(-1)}><SkipBack /></Button>
                <Button variant="secondary" size="icon" title="Aktuellen Block wiederholen" aria-label="Aktuellen Block wiederholen" disabled={!blockJump(blocks, blockIdx, 0)} onClick={() => navigateBlock(0)}><RotateCcw /></Button>
                <Button variant="secondary" size="icon" title="Nächster Block" aria-label="Nächster Block" disabled={!blockJump(blocks, blockIdx, 1)} onClick={() => navigateBlock(1)}><SkipForward /></Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={resetCurrent} disabled={!started}><TimerReset /> Timer neu</Button>
              <Button variant="outline" onClick={resetAll}><RotateCcw /> Zurück</Button>
              <Button variant="outline" onClick={enterFs}><Maximize /> Vollbild</Button>
            </div>
          </div>

          {/* Session */}
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <h2 className="font-bold">Runden & Ablauf</h2>
            <p className="text-xs text-muted-foreground">Die Rundenzahl stellst du pro Block unten ein.</p>
            <Button variant={chain.infinite ? "default" : "outline"} onClick={() => update({ infinite: !chain.infinite })} aria-label="Endlos">
              <InfinityIcon /> Endlos wiederholen
            </Button>
            <Toggle label="3-Sekunden-Vorlauf vor dem Start" checked={chain.prep} onChange={(v) => update({ prep: v })} />
            <Toggle label="3-2-1 Vorwarnung vor jedem Schritt" checked={chain.warn} onChange={(v) => update({ warn: v })} />

          </div>

          {/* Sound */}
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <h2 className="font-bold">Signal & Klang</h2>
            <Choice<Signal> value={chain.signal} onChange={(v) => update({ signal: v })}
              options={[["beep", "Ton"], ["vibrate", "Vibration"], ["both", "Beides"], ["mute", "Stumm"]]} />
            <div className="text-sm">Ansage beim Timer-Wechsel</div>
            <Choice<Cue> value={chain.cue} onChange={(v) => update({ cue: v })}
              options={[["tone", "Ton"], ["voice", "Sprache"], ["both", "Ton + Sprache"]]} />
            {chain.cue !== "tone" && <p className="text-xs text-muted-foreground">Liest den Timer-Namen vor (z. B. „Einatmen“) – mit der Sprachausgabe deines Geräts, auch offline.</p>}
            <div className="text-sm">Klangmodus</div>
            <div className="grid grid-cols-2 gap-2">
              {STEP_SOUNDS.map(([v, l]) => (
                <Button key={v} size="sm" variant={chain.sound === v ? "default" : "outline"} onClick={() => update({ sound: v })}>{l}</Button>
              ))}
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm"><span>Lautstärke</span><span className="text-muted-foreground">{Math.round(chain.volume * 100)}%</span></div>
              <Slider min={0} max={100} step={1} value={[chain.volume * 100]} onValueChange={(v) => update({ volume: (v[0] ?? 80) / 100 })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={testSound}>Signal / Klang testen</Button>
            </div>
            <div className="space-y-3 border-t pt-3">
              <h3 className="font-medium">Abschluss-Klang</h3>
              <Toggle label="Abschluss-Signal nach letzter Runde" checked={chain.finale} onChange={(v) => update({ finale: v })} />
              <Choice<FinaleSound> value={chain.finaleSound} onChange={(v) => update({ finaleSound: v })} options={FINALE_SOUNDS} />
              <Button variant="secondary" size="sm" onClick={() => { audio(); playFinale(chain.finaleSound, chain.volume); }}>Abschluss testen</Button>
            </div>
          </div>

          {/* Display settings */}
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <h2 className="font-bold">Anzeige & Vollbild</h2>
            <div>
              <div className="mb-2 flex justify-between text-sm"><span>Schriftgröße</span><span className="text-muted-foreground">{ui.fontSize}px</span></div>
              <Slider min={40} max={320} step={4} value={[ui.fontSize]} onValueChange={(v) => setU({ fontSize: v[0] ?? 120 })} />
            </div>
            <div className="text-sm">Vollbild-Anzeige</div>
            <Choice<FsMode> value={ui.fsMode} onChange={(v) => setU({ fsMode: v })}
              options={[["numbers", "Nur Zahlen"], ["bar", "Nur Linie"], ["both", "Beides"]]} />
            <Toggle label="Timer-Name anzeigen" checked={ui.showName} onChange={(v) => setU({ showName: v })} />
            <Toggle label="Runde anzeigen" checked={ui.showRound} onChange={(v) => setU({ showRound: v })} />
            <Toggle label="Block anzeigen" checked={ui.showBlock} onChange={(v) => setU({ showBlock: v })} />
            <Toggle label="Vollbild automatisch beim Start" checked={ui.autoFs} onChange={(v) => setU({ autoFs: v })} />
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
              <div className="mb-2 text-sm">Akzentfarbe</div>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setU({ accent: a.id })}
                    aria-label={a.name}
                    title={a.name}
                    className={`size-9 rounded-full border-2 ${ui.accent === a.id ? "border-foreground" : "border-transparent"}`}
                    style={{ background: a.color }}
                  />
                ))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{ACCENTS.find((a) => a.id === ui.accent)?.name}</div>
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <Input value={chain.name} onChange={(e) => update({ name: e.target.value })} className="text-base font-medium" aria-label="Name der Routine" />
            <div className="mt-2 text-sm text-muted-foreground">
              {blocks.length} / {MAX_BLOCKS} Blöcke · {totalTimers} Timer · Gesamt {formatMs(total, ["h", "m", "s"])}
            </div>
          </div>

          {blocks.map((b, bi) => {
            const bActive = started && bi === blockIdx;
            return (
              <div key={b.id} className={`rounded-2xl border bg-card p-3 ${bActive ? "border-primary" : ""}`}>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => updateBlock(bi, { open: !b.open })} aria-label={b.open ? "Zuklappen" : "Aufklappen"}>
                    {b.open ? <ChevronDown /> : <ChevronRight />}
                  </Button>
                  <Layers className="size-4 shrink-0 text-primary" />
                  <Input value={b.name} onChange={(e) => updateBlock(bi, { name: e.target.value })} className="h-9 font-medium" aria-label={`Name Block ${bi + 1}`} />
                  <Button variant="ghost" size="icon" onClick={() => moveBlock(bi, -1)} disabled={bi === 0} aria-label="Block nach oben"><ArrowUp /></Button>
                  <Button variant="ghost" size="icon" onClick={() => moveBlock(bi, 1)} disabled={bi === blocks.length - 1} aria-label="Block nach unten"><ArrowDown /></Button>
                  <Button variant="ghost" size="icon" onClick={() => removeBlock(bi)} disabled={blocks.length <= 1} aria-label="Block löschen" className="text-destructive"><Trash2 /></Button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 pl-10 text-sm">
                  <label className="flex items-center gap-2">
                    Runden
                    <Input
                      type="number" inputMode="numeric" min={1} className="h-10 w-24 font-mono text-lg"
                      value={b.rounds} aria-label={`Runden Block ${bi + 1}`}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateBlock(bi, { rounds: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                    />
                  </label>
                  <span className="text-muted-foreground">{b.timers.length} Timer · {formatMs(blockTotal(b), ["h", "m", "s"])}</span>
                </div>
                {b.open && (
                  <>
                    <ol className="mt-3 space-y-2">
                      {b.timers.map((t, i) => {
                        const parts = splitMs(t.ms, chain.units);
                        const active = bActive && !prepping && i === index;
                        return (
                          <li key={t.id} className={`rounded-xl border bg-background p-3 ${active ? "border-primary ring-2 ring-primary/40" : ""}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</span>
                              <Input placeholder={`Timer ${i + 1}`} value={t.name} onChange={(e) => updateTimer(bi, t.id, { name: e.target.value })} className="h-9" />
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
                                      updateTimer(bi, t.id, { ms: joinMs({ ...parts, [u]: v }) });
                                    }}
                                  />
                                </label>
                              ))}
                              <div className="ml-auto flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => move(bi, i, -1)} disabled={i === 0} aria-label="Nach oben"><ArrowUp /></Button>
                                <Button variant="ghost" size="icon" onClick={() => move(bi, i, 1)} disabled={i === b.timers.length - 1} aria-label="Nach unten"><ArrowDown /></Button>
                                <Button variant="ghost" size="icon" onClick={() => duplicate(bi, i)} disabled={b.timers.length >= MAX_TIMERS} aria-label="Duplizieren"><Copy /></Button>
                                <Button variant="ghost" size="icon" onClick={() => remove(bi, i)} aria-label="Löschen" className="text-destructive"><Trash2 /></Button>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1 pl-8">
                              <div className="text-xs text-muted-foreground" id={`cue-label-${t.id}`}>Signal beim Start</div>
                              <Select value={t.cue ?? "standard"} onValueChange={(v) => updateTimer(bi, t.id, { cue: v as TimerCue })}>
                                <SelectTrigger aria-labelledby={`cue-label-${t.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard (wie Routine)</SelectItem>
                                  <SelectItem value="tone">Ton</SelectItem>
                                  <SelectItem value="voice">Sprache</SelectItem>
                                  <SelectItem value="both">Ton + Sprache</SelectItem>
                                  <SelectItem value="mute">Stumm</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                    <Button className="mt-2 h-11 w-full" variant="secondary" onClick={() => addTimer(bi)} disabled={b.timers.length >= MAX_TIMERS}>
                      <Plus /> Timer hinzufügen
                    </Button>
                  </>
                )}
              </div>
            );
          })}
          <Button className="h-12 w-full" variant="outline" onClick={addBlock} disabled={blocks.length >= MAX_BLOCKS}>
            <Layers /> Block hinzufügen ({blocks.length}/{MAX_BLOCKS})
          </Button>

          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Vorlagen</h2>
              <Button size="sm" onClick={savePreset}><Save /> Speichern</Button>
            </div>
            {presets.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Vorlagen gespeichert.</p>}
            {presetError && <p role="alert" className="mb-2 text-sm text-destructive">{presetError}</p>}
            <ul className="space-y-2">
              {presets.map((p, i) => {
                const saved = withDefaults(p);
                const fits = blocks.length + saved.blocks.length <= MAX_BLOCKS;
                return (
                  <li key={p.name + i} className="space-y-2 rounded-lg bg-muted px-3 py-3">
                    <div className="flex items-center gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{saved.blocks.length} Blöcke · {saved.blocks.reduce((a, x) => a + x.timers.length, 0)} Timer{p.infinite ? " · ∞" : ""}</div>
                      </div>
                      <Button size="icon" variant="ghost" title="Vorlage nach oben" aria-label="Vorlage nach oben" disabled={i === 0} onClick={() => setPresets((ps) => reorder(ps, i, -1))}><ArrowUp /></Button>
                      <Button size="icon" variant="ghost" title="Vorlage nach unten" aria-label="Vorlage nach unten" disabled={i === presets.length - 1} onClick={() => setPresets((ps) => reorder(ps, i, 1))}><ArrowDown /></Button>
                      <Button size="icon" variant="ghost" onClick={() => renamePreset(i)} aria-label="Umbenennen"><Pencil /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setPresets((ps) => ps.filter((_, k) => k !== i))} aria-label="Vorlage löschen"><Trash2 /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={saved.blocks.length > MAX_BLOCKS} onClick={() => loadPreset(p, "replace")}>Ersetzen</Button>
                      <Button size="sm" variant="outline" disabled={!fits} onClick={() => loadPreset(p, "append")}><ArrowDown /> Unten anhängen</Button>
                      <Button size="sm" variant="outline" disabled={!fits} onClick={() => loadPreset(p, "prepend")}><ArrowUp /> Oben einfügen</Button>
                    </div>
                    {!fits && <p className="text-xs text-muted-foreground">Kombination überschreitet {MAX_BLOCKS} Blöcke.</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
