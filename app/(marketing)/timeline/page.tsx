import type { Metadata } from "next";
import Pill from "@/components/Pill";
import Section from "@/components/Section";
import Timeline from "@/components/Timeline";
import ChipotleCounter from "@/components/ChipotleCounter";
import { chipotleCount } from "@/lib/memories";

export const metadata: Metadata = {
  title: "Our story",
  description: "Every memorable date in our relationship, so far.",
  robots: { index: false, follow: false },
};

export default function TimelinePage() {
  return (
    <Section className="relative overflow-hidden pt-14 sm:pt-20">
      <span className="blob left-[-8%] top-[2%] h-72 w-72 bg-you/25 animate-float-slow" />
      <span className="blob right-[-8%] top-[10%] h-80 w-80 bg-me/20 animate-float-slow [animation-delay:-3s]" />

      <div className="relative mx-auto max-w-2xl text-center">
        <Pill tone="you" className="mx-auto">
          our story
        </Pill>
        <h1 className="mt-6 text-4xl font-semibold sm:text-5xl lg:text-6xl">
          every date with <span className="text-duo">you</span>, so far
        </h1>
        <p className="mt-5 text-lg text-muted">
          A little timeline of us — every movie, every drive, every Chipotle
          run. Scroll down and relive it.
        </p>

        <div className="mt-9 flex justify-center">
          <ChipotleCounter count={chipotleCount} />
        </div>
      </div>

      <div className="relative mt-16">
        <Timeline />
      </div>
    </Section>
  );
}
