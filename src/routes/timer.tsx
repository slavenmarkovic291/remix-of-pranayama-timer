import { createFileRoute } from "@tanstack/react-router";
import { TimerStudio } from "@/components/TimerStudio";
import { pageHead } from "@/lib/learning";
export const Route = createFileRoute("/timer")({ head: () => pageHead("Pranayama Timer – PRANA-XP Studio", "Deine bestehenden Atemroutinen mit Blöcken, Vorlagen, Runden, Atemkreis und Klängen."), component: TimerStudio });