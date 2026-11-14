import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownToLine, ArrowUpFromLine, CirclePause, Pause, Play, RotateCcw, Save, Volume2, X, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { Practice } from "@/lib/library";
import { makeSession, phaseInstruction, roundsForMinutes, sessionAt, type PracticeSession } from "@/lib/pranayama-session";
import { configuredPracticeSession, defaultPracticeSettings, loadPracticeSettings, savePracticeSettings, validPracticeSettings, type PracticeSettings } from "@/lib/practice-settings";
import { formatMs } from "@/lib/timer";
import { audio, playFinale, playStep, speak, vibrate, STEP_SOUNDS, type SoundMode } from "@/lib/sound";

function PhaseIcon({ phase }: { phase: string }) {
  const Icon = phase === "in" ? ArrowDownToLine : phase === "out" ? ArrowUpFromLine : phase === "neutral" ? Wind : CirclePause;
  return <Icon aria-hidden className="size-5"/>;
}

function Visualizer({ session, elapsed, practice, preview = false }: { session: PracticeSession; elapsed: number; practice: Practice; preview?: boolean }) {
  const state = sessionAt(session, elapsed);
  return <div className={`practice-orbit phase-${state.phase.phase} ${preview ? "is-preview" : ""}`}>
    <div aria-hidden className={`breathing-sphere ${state.phase.phase === "holdFull" ? "is-holding" : ""}`} style={preview ? undefined : { transform: `scale(${session.paced ? state.scale : 0.85})`, opacity: session.paced ? state.scale : 0.85 }}/>
    <div className="orbit-label"><PhaseIcon phase={state.phase.phase}/><strong>{state.finished ? "Abgeschlossen" : preview ? session.paced ? "Dein Atemrhythmus" : "Dein eigener Rhythmus" : state.phase.label}</strong><span className="orbit-count">{preview ? <Wind className="size-10"/> : state.finished ? "✓" : session.paced ? Math.ceil(state.phaseRemaining / 1000) : formatMs(state.remaining, ["m", "s"])}</span><small>{preview ? session.paced ? `${session.cycleMs / 1000} s pro Runde` : `${formatMs(session.totalMs, ["m", "s"])} Gesamtzeit` : !state.finished ? phaseInstruction(practice, state.phase, state.round) : "Nimm dir einen Moment."}</small></div>
  </div>;
}

function PhaseCards({ session, active }: { session: PracticeSession; active?: number | undefined }) {
  return <div className="practice-phases">{session.phases.map((phase, i) => <div key={phase.id} className={`practice-phase phase-${phase.phase} ${active === i ? "is-active" : ""}`} aria-current={active === i ? "step" : undefined}>
    <PhaseIcon phase={phase.phase}/><span>{phase.label}</span><strong>{session.paced ? `${phase.ms / 1000} s` : formatMs(phase.ms, ["m", "s"])}</strong>{phase.instruction && <small>{phase.instruction}</small>}
  </div>)}</div>;
}

export function PracticeTimer({ practice: p }: { practice: Practice }) {
  const base = makeSession(p);
  const defaults = defaultPracticeSettings(p);
  const [mode, setMode] = useState<PracticeSettings["mode"]>(defaults.mode);
  const toFields = (s: PracticeSettings) => ({ inhale: String(s.inhale), holdIn: String(s.holdIn), exhale: String(s.exhale), holdOut: String(s.holdOut), rounds: String(s.rounds), minutes: String(s.minutes) });
  const [fields, setFields] = useState(() => toFields(defaults));
  const [saveStatus, setSaveStatus] = useState("");
  const settings: PracticeSettings = { mode, inhale: Number(fields.inhale), holdIn: Number(fields.holdIn), exhale: Number(fields.exhale), holdOut: Number(fields.holdOut), rounds: Number(fields.rounds), minutes: Number(fields.minutes) };
  const valid = validPracticeSettings(settings) && Object.values(fields).every((v) => v.trim() !== "");
  const session = configuredPracticeSession(p, valid ? settings : defaults);
  const rounds = settings.rounds;
  const [snapshot, setSnapshot] = useState(session);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sound, setSound] = useState<SoundMode>("wood");
  const [volume, setVolume] = useState(0.35);
  const [tones, setTones] = useState(true);
  const [voice, setVoice] = useState(false);
  const [vibration, setVibration] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canVibrate, setCanVibrate] = useState(false);
  const [ready, setReady] = useState(false);
  const anchor = useRef(0);
  const carried = useRef(0);
  const cueKey = useRef("");
  const finale = useRef(false);
  const current = sessionAt(snapshot, elapsed);
  useEffect(() => {
    const saved = loadPracticeSettings(p);
    setMode(saved.mode); setFields(toFields(saved));
    setSaveStatus(""); setCanVibrate("vibrate" in navigator); setReady(true);
  }, [p]);

  useEffect(() => {
    if (!open || !running) return;
    let frame = 0;
    const tick = () => {
      const next = Math.min(snapshot.totalMs, carried.current + performance.now() - anchor.current);
      setElapsed(next);
      if (next >= snapshot.totalMs) { carried.current = next; setRunning(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, running, snapshot]);

  useEffect(() => {
    if (!open) return;
    if (current.finished) {
      if (!finale.current) { finale.current = true; if (tones) playFinale("bowl", volume); }
      return;
    }
    if (!running) return;
    const key = `${current.round}:${current.index}`;
    if (cueKey.current === key) return;
    cueKey.current = key;
    if (tones) playStep(sound, current.index, volume);
    if (voice) speak(phaseInstruction(p, current.phase, current.round), volume);
    if (vibration) vibrate([100]);
  }, [open, running, current.finished, current.index, current.round, current.phase, p, sound, volume, tones, voice, vibration]);

  const stopSpeech = () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); };
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  const edit = (name: keyof typeof fields, value: string) => { setFields((previous) => ({ ...previous, [name]: value })); setSaveStatus(""); };
  const choose = (minutes: number) => { edit(session.paced ? "rounds" : "minutes", String(session.paced ? roundsForMinutes(session, minutes) : minutes)); };
  const save = () => { setSaveStatus(savePracticeSettings(p.id, settings) ? "Auf diesem Gerät gespeichert." : "Speichern nicht möglich. Bitte prüfe die Speichereinstellungen deines Browsers."); };
  const start = () => {
    audio(); stopSpeech(); setSnapshot(session); carried.current = 0; anchor.current = performance.now();
    cueKey.current = ""; finale.current = false; setElapsed(0); setOpen(true); setRunning(true);
  };
  const pause = () => {
    carried.current = Math.min(snapshot.totalMs, carried.current + performance.now() - anchor.current);
    setElapsed(carried.current); setRunning(false); stopSpeech();
  };
  const resume = () => { audio(); anchor.current = performance.now(); setRunning(true); };
  const reset = () => { carried.current = 0; cueKey.current = ""; finale.current = false; setElapsed(0); setRunning(false); stopSpeech(); };
  const close = () => { if (running) pause(); setOpen(false); stopSpeech(); };
  return <section className="practice-setup" aria-label="Praxistimer" data-ready={ready}>
    <div className="practice-setup-grid"><div><div className="prana-eyebrow">{session.paced ? "ATEM & RHYTHMUS" : "ZEIT FÜR DEINE PRAXIS"}</div><Visualizer practice={p} session={session} elapsed={0} preview/><PhaseCards session={session}/></div>
      <div className="practice-session-options"><h2>Deine Timerzeiten</h2><div className="practice-timing-mode" role="group" aria-label="Atemmodus">
        {base.paced && <Button variant={mode === "paced" ? "default" : "outline"} aria-pressed={mode === "paced"} onClick={() => { setMode("paced"); setSaveStatus(""); }}><Wind/> Atemphasen</Button>}
        <Button variant={mode === "free" ? "default" : "outline"} aria-pressed={mode === "free"} onClick={() => { setMode("free"); setSaveStatus(""); }}><CirclePause/> Freies Atmen</Button>
      </div>
      {session.paced && <div className="practice-timing-fields">{([
        ["inhale", "Einatmen (Sekunden)", 0.1], ["holdIn", "Halten voll (Sekunden)", 0],
        ["exhale", "Ausatmen (Sekunden)", 0.1], ["holdOut", "Halten leer (Sekunden)", 0],
      ] as const).map(([name, label, min]) => <label key={name}>{label}<Input type="number" min={min} step="any" value={fields[name]} onChange={(e) => edit(name, e.target.value)}/></label>)}</div>}
      <h3 className="practice-length-title">Sitzungslänge</h3><div className="session-choices" role="group" aria-label="Sitzungslänge">
        <Button variant="outline" onClick={() => { edit(session.paced ? "rounds" : "minutes", String(session.paced ? defaults.rounds : defaults.minutes)); }}><span>Vorgabe</span><strong>{session.paced ? `${defaults.rounds} Runden` : `${defaults.minutes} min`}</strong></Button>
        {(p.id === "nadi-shuddhi" ? [4, 7, 10] : [3, 7, 10]).map((minutes) => {
          const count = roundsForMinutes(session, minutes);
          const selected = session.paced ? rounds === count : settings.minutes === minutes;
          return <Button key={minutes} variant={selected ? "default" : "outline"} onClick={() => choose(minutes)} aria-pressed={selected}><strong>{minutes} min</strong><span>{session.paced ? `${count} Runden` : "Eigener Rhythmus"}</span></Button>;
        })}
      </div><label className="practice-custom">{session.paced ? "Eigene Rundenzahl" : "Eigene Dauer in Minuten"}<Input type="number" min={session.paced ? 1 : 0.1} step={session.paced ? "1" : "any"} value={session.paced ? fields.rounds : fields.minutes} onChange={(e) => edit(session.paced ? "rounds" : "minutes", e.target.value)}/></label>
      <p className="lib-note">{session.paced ? `${rounds} Runden · ${formatMs(session.totalMs, ["m", "s"])} Minuten` : `${formatMs(session.totalMs, ["m", "s"])} Gesamtzeit · eigener Atemrhythmus`}</p>
      {p.id === "nadi-shuddhi" && <p className="lib-note">Empfehlung: mindestens 4 Minuten, langsam und lautlos im eigenen Rhythmus. Wechsle die Nasenöffnung erst nach dem Ausatmen.</p>}
      {!valid && <p role="alert" className="lib-note">Bitte gültige Zeiten eingeben: Ein- und Ausatmen sowie Dauer größer als 0, Haltezeiten ab 0 und ganze Runden ab 1.</p>}
      <div className="practice-save-times"><Button variant="outline" onClick={save} disabled={!ready || !valid}><Save/> Zeiten speichern</Button><p role="status" className="lib-note">{saveStatus}</p></div>
      {session.paced && <p className="lib-note">Zeitvorgaben sind Orientierung, kein Zwang. Atme sanft; pausiere bei Unwohlsein.</p>}
      <div className="practice-before"><h3>Bevor du beginnst</h3><p>{p.cautions}</p><p><strong>Voraussetzungen:</strong> {p.prerequisites}</p></div>
      <Button size="lg" className="practice-start" onClick={start} disabled={!ready || !valid}><Play/> Praxis starten · {formatMs(session.totalMs, ["m", "s"])}</Button>
    </div></div>
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) close(); }}><Dialog.Portal><Dialog.Overlay className="practice-overlay"/><Dialog.Content aria-describedby="practice-player-description" className="prana-app practice-player">
      <header className="practice-player-header"><Button variant="ghost" size="icon" onClick={close} aria-label="Praxis schließen" title="Praxis schließen"><X/></Button><div><Dialog.Title>{p.name}</Dialog.Title><Dialog.Description id="practice-player-description">{current.finished ? "Sitzung abgeschlossen" : `${formatMs(current.remaining, ["m", "s"])} verbleibend`}</Dialog.Description></div><span className="player-brand">PRANA-XP</span></header>
      <progress className="practice-total-progress" value={elapsed} max={snapshot.totalMs} aria-label="Sitzungsfortschritt"/>
      <div className="practice-player-main" data-running={running}><div className="prana-eyebrow" role="status">{current.finished ? "PRAXIS BEENDET" : running ? "DEIN MOMENT" : "PAUSIERT"}</div><Visualizer session={snapshot} elapsed={elapsed} practice={p}/><PhaseCards session={snapshot} active={current.finished ? undefined : current.index}/><p className="practice-round">{snapshot.paced ? `Runde ${current.round} von ${snapshot.rounds}` : `${formatMs(current.remaining, ["m", "s"])} verbleibend`}</p>
      <div className="practice-player-controls"><Button variant="outline" size="icon" onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Sound-Einstellungen" title="Sound-Einstellungen" aria-expanded={settingsOpen}><Volume2/></Button><Button className="practice-play" size="icon" aria-label={current.finished ? "Praxis erneut starten" : running ? "Praxis pausieren" : "Praxis fortsetzen"} title={running ? "Pause" : "Start"} onClick={current.finished ? start : running ? pause : resume}>{running ? <Pause/> : <Play/>}</Button><Button variant="outline" size="icon" aria-label="Praxis zurücksetzen" title="Praxis zurücksetzen" onClick={reset}><RotateCcw/></Button></div>
      {settingsOpen && <section className="practice-sound" aria-label="Sound-Einstellungen"><h2>Klänge & Signale</h2><label>Phasenklänge<Switch checked={tones} onCheckedChange={setTones}/></label><label>Sprachausgabe<Switch checked={voice} onCheckedChange={setVoice}/></label><label>Vibration{!canVibrate && <small>Nicht verfügbar</small>}<Switch checked={vibration} onCheckedChange={setVibration} disabled={!canVibrate}/></label><label className="sound-selection">Klang<select value={sound} onChange={(e) => { const found = STEP_SOUNDS.find(([id]) => id === e.target.value); if (found) setSound(found[0]); }}>{STEP_SOUNDS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Lautstärke <span>{Math.round(volume * 100)} %</span></label><Slider aria-label="Lautstärke" value={[volume]} min={0} max={1} step={0.05} onValueChange={([v]) => { if (v !== undefined) setVolume(v); }}/><Button variant="outline" onClick={() => { audio(); playStep(sound, 0, volume); }}>Klang testen <Volume2/></Button></section>}
      {current.finished && <Button variant="link" onClick={close}>Zurück zur Praktik</Button>}<p className="practice-player-note">Sanft atmen. Du kannst jederzeit aufhören.</p></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}