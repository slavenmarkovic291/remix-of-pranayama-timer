/** Shared shape for every library entry so all practices are maintained by the same rules. */
export type CategoryId = "nostril" | "calming" | "activating" | "kumbhaka" | "traditional" | "modern";
export type Tradition = "hatha" | "yoga-sutra" | "school" | "modern" | "clinical";
export type Mechanics = "alternate" | "nasal" | "mouth" | "segmental" | "retention" | "sound" | "rapid" | "abdominal";
export type Kind = "pranayama" | "kriya" | "variation" | "method";
export type Level = 1 | 2 | 3;
export type ReviewStatus = "draft" | "incomplete";

export interface TimerPlan { inhale: number; holdIn?: number; exhale: number; holdOut?: number; rounds: number; note?: string }

export interface Practice {
  id: string;
  name: string;
  alt: string[];
  category: CategoryId;
  tradition: Tradition;
  kind: Kind;
  mechanics: Mechanics;
  level: Level;
  /** One of the eight kumbhakas named in Hatha Yoga Pradipika 2.44. */
  hypKumbhaka?: boolean;
  short: string;
  intro: string;
  origin: string;
  steps: string[];
  ratio?: string;
  purpose: string;
  traditional: string;
  science: string;
  unclear: string;
  bestTime: string;
  foodNote?: string;
  prerequisites: string;
  cautions: string;
  sources: string[];
  timer?: TimerPlan;
  status: ReviewStatus;
}
