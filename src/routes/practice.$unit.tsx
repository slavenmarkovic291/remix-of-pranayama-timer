import { createFileRoute, notFound } from "@tanstack/react-router";
import { GuidedPractice } from "@/components/prana/GuidedPractice";
import { getUnit, pageHead } from "@/lib/learning";
export const Route = createFileRoute("/practice/$unit")({
  loader: ({ params }) => { const unit = getUnit(params.unit); if (!unit) throw notFound(); return unit; },
  head: ({ loaderData }) => pageHead(`${loaderData?.title ?? "Praxis nicht verfügbar"} – Praxis mit PRANA-XP`, loaderData?.description ?? "Erlebe die Praxisbereiche von PRANA-XP."),
  component: PracticePage,
});
function PracticePage() { const unit = Route.useLoaderData(); return <GuidedPractice key={unit.id} unit={unit}/>; }