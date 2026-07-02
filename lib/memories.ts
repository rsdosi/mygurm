import type { Tone } from "./content";

export type MemorySize = "normal" | "big" | "biggest";

export type TimelineEvent = {
  id: string;
  date: string;
  /** month*100 + day, for chronological sorting. */
  md: number;
  title: string;
  body: string;
  emoji: string;
  tone: Tone;
  quote?: string;
  flowers?: string;
  chipotle?: boolean;
  size?: MemorySize;
  /** True for events added by a user (vs. the seeded story). */
  custom?: boolean;
};

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/** "June 11" -> 611. Unknown -> 0. */
export function parseMd(dateStr: string): number {
  const [mon, dayRaw] = dateStr.trim().split(/\s+/);
  const m = MONTHS[(mon ?? "").toLowerCase()] ?? 0;
  const d = parseInt(dayRaw ?? "", 10) || 0;
  return m * 100 + d;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** An ISO "2026-06-11" (from <input type=date>) -> "June 11". */
export function isoToLabel(iso: string): string {
  const [, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const name = Object.keys(MONTHS).find((k) => MONTHS[k] === m);
  const day = d || 1;
  return name ? `${name[0].toUpperCase()}${name.slice(1)} ${day}` : iso;
}

type Seed = Omit<TimelineEvent, "id" | "md" | "custom">;

const seed: Seed[] = [
  {
    date: "March 6",
    emoji: "🎬",
    title: "The very first date",
    body: "The day I asked out my girl for the very first time. We went to the movies and watched Hoppers, then got Chipotle after.",
    chipotle: true,
    tone: "you",
  },
  {
    date: "March 17",
    emoji: "🚗",
    title: "Cucina Venti & a Zipcar joyride",
    body: "Dinner at Cucina Venti, then we Zipcarred all around Palo Alto and Mountain View — blasting Hindi and pop bangers the whole way.",
    tone: "me",
  },
  {
    date: "April 9",
    emoji: "🛍️",
    title: "Aritzia run for Jiya's gift",
    body: "We hunted down Jiya's gift at Aritzia in the Stanford shopping mall — and grabbed Chipotle, of course.",
    chipotle: true,
    tone: "you",
  },
  {
    date: "April 26",
    emoji: "🎭",
    title: "The Drama, then Chipotle",
    body: "We caught The Drama at the movies together… then Chipotle right after, naturally.",
    chipotle: true,
    tone: "me",
  },
  {
    date: "May 1",
    emoji: "💐",
    title: "Flowers & P.F. Chang's",
    body: "I brought her flowers — pink and white — and we went to P.F. Chang's.",
    flowers: "pink & white",
    tone: "you",
  },
  {
    date: "May 2",
    emoji: "🍣",
    title: "MJ Sushi & Superbloom",
    body: "MJ Sushi during the day, then Superbloom that evening.",
    tone: "me",
  },
  {
    date: "May 20",
    emoji: "🌉",
    title: "A whole day in San Francisco",
    body: "Our big SF day. We started at Stonestown Galleria (Chipotle there, obviously), then the de Young Museum, a cozy little coffee shop, a Golden Gate viewpoint, and dinner at Tiya.",
    chipotle: true,
    size: "big",
    tone: "you",
  },
  {
    date: "May 28",
    emoji: "💛",
    title: "Formal, together",
    body: "We went to formal together — and I brought her flowers again, this time yellow and green.",
    flowers: "yellow & green",
    tone: "me",
  },
  {
    date: "June 9",
    emoji: "💗",
    title: "The day we started dating",
    body: "We went to Color Me Mine, the little pottery studio on University Avenue, and I made her a trinket box. Then — Chipotle right after, of course.",
    quote: "May I be all yours?",
    chipotle: true,
    size: "biggest",
    tone: "you",
  },
  {
    date: "June 11",
    emoji: "🎂",
    title: "My birthday",
    body: "Mount Tam in the morning, dinner at Eylan in the evening.",
    tone: "me",
  },
];

export const seedEvents: TimelineEvent[] = seed.map((s) => ({
  ...s,
  id: `seed-${slugify(s.date)}`,
  md: parseMd(s.date),
  custom: false,
}));

/** The Chipotle-run count from our canonical story (stays 5, doesn't drift). */
export const chipotleCount = seedEvents.filter((e) => e.chipotle).length;

/** Merge seed + custom events, chronologically. */
export function mergeEvents(custom: TimelineEvent[]): TimelineEvent[] {
  return [...seedEvents, ...custom].sort((a, b) => a.md - b.md);
}
