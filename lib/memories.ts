import type { Tone } from "./content";

export type MemorySize = "normal" | "big" | "biggest";

export type Memory = {
  date: string;
  emoji: string;
  title: string;
  body: string;
  /** Highlighted quote (e.g. what the trinket box said). */
  quote?: string;
  /** Flower colors, if flowers were given that day. */
  flowers?: string;
  chipotle?: boolean;
  size?: MemorySize;
  tone: Tone;
};

export const memories: Memory[] = [
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

/** How many of these dates involved a Chipotle run. */
export const chipotleCount = memories.filter((m) => m.chipotle).length;
