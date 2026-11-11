import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/prana/Screens";
import { pageHead } from "@/lib/learning";

export const Route = createFileRoute("/")({
  head: () => pageHead("PRANA-XP – Bewusstsein entdecken", "Körper, Atem, Sinne und innere Erfahrung: ein gemeinsamer Weg des Verstehens, Übens und Erforschens."),
  component: HomeScreen,
});
