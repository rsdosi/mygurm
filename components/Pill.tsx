import type { ReactNode } from "react";

type Tone = "you" | "me" | "neutral";

const dotColors: Record<Tone, string> = {
  you: "bg-you",
  me: "bg-me",
  neutral: "bg-muted",
};

export default function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill border border-line bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${dotColors[tone]}`}
      />
      {children}
    </span>
  );
}
