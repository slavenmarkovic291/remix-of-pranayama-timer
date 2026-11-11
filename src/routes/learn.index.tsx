import { createFileRoute } from "@tanstack/react-router";
import { LearnScreen } from "@/components/prana/Screens";
import { pageHead } from "@/lib/learning";
export const Route = createFileRoute("/learn/")({ head: () => pageHead("Verstehen – PRANA-XP", "Vier Einstiege in Körper-, Atem-, Sinnes- und innere Wahrnehmung."), component: LearnScreen });