import { createFileRoute, notFound } from "@tanstack/react-router";
import { LearningDetail } from "@/components/prana/LearningDetail";
import { getUnit, pageHead } from "@/lib/learning";
export const Route = createFileRoute("/learn/$pillar")({
  loader: ({ params }) => { const unit = getUnit(params.pillar); if (!unit) throw notFound(); return unit; },
  head: ({ loaderData }) => pageHead(`${loaderData?.title ?? "Einheit nicht verfügbar"} – Lernen mit PRANA-XP`, loaderData?.description ?? "Entdecke die Lernbereiche von PRANA-XP."),
  component: UnitPage,
});
function UnitPage() { const unit = Route.useLoaderData(); return <LearningDetail key={unit.id} unit={unit}/>; }