import { createFileRoute } from "@tanstack/react-router";
import { LibraryList } from "@/components/library/LibraryList";
import { pageHead } from "@/lib/learning";
export const Route = createFileRoute("/pranayama/")({ head: () => pageHead("Pranayama-Bibliothek – 57 Praktiken | PRANA-XP", "Traditionelle und moderne Atemtechniken mit Anleitung, Herkunft, Evidenz und Vorsichtshinweisen."), component: LibraryList });
