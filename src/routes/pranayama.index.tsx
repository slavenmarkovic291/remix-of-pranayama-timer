import { createFileRoute } from "@tanstack/react-router";
import { LibraryList } from "@/components/library/LibraryList";
import { pageHead } from "@/lib/learning";
import { practices } from "@/lib/library";
export const Route = createFileRoute("/pranayama/")({ head: () => pageHead(`Pranayama-Bibliothek – ${practices.length} Praktiken | PRANA-XP`, "Atemtechniken mit Anleitung, Herkunft und Vorsichtshinweisen; eigene Praxisfolgen zusammenstellen und direkt starten."), component: LibraryList });
