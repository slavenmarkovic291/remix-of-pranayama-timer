import { createFileRoute, notFound } from "@tanstack/react-router";
import { PracticeDetail } from "@/components/library/PracticeDetail";
import { getPractice } from "@/lib/library";
import { pageHead } from "@/lib/learning";
export const Route = createFileRoute("/pranayama/$id")({
  loader: ({ params }) => { const p = getPractice(params.id); if (!p) throw notFound(); return { id: p.id }; },
  head: ({ loaderData }) => { const p = loaderData && getPractice(loaderData.id); return p ? pageHead(`${p.name} – Pranayama | PRANA-XP`, p.short) : pageHead("Praktik nicht gefunden | PRANA-XP", "Diese Praktik gibt es nicht."); },
  component: function Page() { const { id } = Route.useLoaderData(); return <PracticeDetail practice={getPractice(id)!} />; },
});
