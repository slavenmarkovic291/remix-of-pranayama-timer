import { createFileRoute } from "@tanstack/react-router";
import { PracticeScreen } from "@/components/prana/Screens";
import { pageHead } from "@/lib/learning";
export const Route = createFileRoute("/practice/")({ head: () => pageHead("Praktizieren – PRANA-XP", "Kurze geführte Übungen für Körper, Atem, Sinne und innere Beobachtung."), component: PracticeScreen });