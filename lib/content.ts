export type Tone = "you" | "me";

export type Activity = {
  slug: string;
  emoji: string;
  title: string;
  blurb: string;
  tag: string;
  tone: Tone;
};

export const activities: Activity[] = [
  {
    slug: "photo-booth",
    emoji: "📸",
    title: "Four-cut photo booth",
    blurb:
      "Snap a synced four-cut strip from two cities and stitch it into one keepsake.",
    tag: "Signature",
    tone: "you",
  },
  {
    slug: "watch-party",
    emoji: "🍿",
    title: "Watch party",
    blurb:
      "Press play at the exact same second. Reactions, timestamps and all.",
    tag: "Chill",
    tone: "me",
  },
  {
    slug: "cook-together",
    emoji: "🍜",
    title: "Cook the same meal",
    blurb:
      "One recipe, two kitchens. Plate up and compare on a shared video call.",
    tag: "Cozy",
    tone: "you",
  },
  {
    slug: "quiz-night",
    emoji: "🧠",
    title: "Couple quiz night",
    blurb:
      "How well do you know me? Answer in secret, then reveal the score.",
    tag: "Playful",
    tone: "me",
  },
  {
    slug: "draw-together",
    emoji: "🎨",
    title: "Draw together",
    blurb:
      "A shared canvas where your pink and my blue meet somewhere in the middle.",
    tag: "Creative",
    tone: "you",
  },
  {
    slug: "star-map",
    emoji: "✨",
    title: "Same sky, star map",
    blurb:
      "See the stars above both of you tonight and pick a constellation to share.",
    tag: "Dreamy",
    tone: "me",
  },
];

export type Step = {
  n: string;
  title: string;
  body: string;
  tone: Tone;
};

export const steps: Step[] = [
  {
    n: "01",
    title: "Set up you + me",
    body: "Create your shared space. You pick pink, I pick blue — that's how everything stays labeled and playful.",
    tone: "you",
  },
  {
    n: "02",
    title: "Pick tonight's activity",
    body: "Browse the hub and choose something to do together — from a synced watch party to a four-cut photo booth.",
    tone: "me",
  },
  {
    n: "03",
    title: "Do it together, apart",
    body: "Hop into the shared room. mygurm keeps you in sync across timezones so it feels like one moment.",
    tone: "you",
  },
  {
    n: "04",
    title: "Keep the memory",
    body: "Every date leaves a little keepsake in your shared timeline. Look back whenever the miles feel long.",
    tone: "me",
  },
];

export type Faq = {
  q: string;
  a: string;
};

export const faqs: Faq[] = [
  {
    q: "What exactly is mygurm?",
    a: "mygurm is an activity hub built for long-distance couples. Instead of scrolling for date ideas, you open the hub, pick something, and do it together in a shared room — no matter how many miles or timezones are between you.",
  },
  {
    q: "What's with the pink and blue?",
    a: "It's our little duotone language. Pink is “you”, blue is “me.” Across the whole product, that color coding keeps shared moments feeling personal and playful.",
  },
  {
    q: "Do we both need an account?",
    a: "Yep — mygurm is made for two. Each of you gets your own side of the shared space, which is how activities stay synced and keepsakes stay attributed.",
  },
  {
    q: "Does it work across timezones?",
    a: "That's the whole point. Activities are synced in real time, and mygurm handles the timezone math so “tonight” lines up for both of you.",
  },
  {
    q: "Is it available now?",
    a: "We're putting the finishing touches on it. This is the landing site for now — browse the activities to see what's coming, and check back soon.",
  },
];
