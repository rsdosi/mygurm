import type { Metadata } from "next";
import Button from "@/components/Button";
import Pill from "@/components/Pill";
import Card from "@/components/Card";
import Section from "@/components/Section";
import { activities } from "@/lib/content";

export const metadata: Metadata = {
  title: "Activities — mygurm",
  description:
    "Browse the mygurm activity hub: synced watch parties, four-cut photo booths, couple quizzes and more — all built for long-distance couples.",
};

export default function ActivitiesPage() {
  return (
    <>
      <Section className="relative overflow-hidden pt-14 sm:pt-20">
        <span className="blob left-[-6%] top-[-8%] h-64 w-64 bg-you/25" />
        <span className="blob right-[-6%] top-0 h-72 w-72 bg-me/20" />
        <div className="relative max-w-2xl">
          <Pill tone="you">the hub</Pill>
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl lg:text-6xl">
            Things to do <span className="text-duo">together</span>, apart
          </h1>
          <p className="mt-5 text-lg text-muted">
            Every activity is synced across your two places, color-coded pink
            for you and blue for me, and leaves a little keepsake behind.
          </p>
        </div>
      </Section>

      <Section className="!pt-0">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <Card key={a.slug} as="li" interactive className="flex flex-col">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                    a.tone === "you" ? "bg-you-soft" : "bg-me-soft"
                  }`}
                  aria-hidden="true"
                >
                  {a.emoji}
                </div>
                <Pill tone={a.tone}>{a.tag}</Pill>
              </div>
              <h2 className="mt-5 text-xl font-semibold">{a.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {a.blurb}
              </p>
              <div className="mt-6">
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                    a.tone === "you" ? "text-you-ink" : "text-me-ink"
                  }`}
                >
                  Coming soon
                </span>
              </div>
            </Card>
          ))}
        </ul>

        <div className="mt-14 rounded-card border border-line bg-white p-8 text-center shadow-soft sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            More landing in the hub soon
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            We&apos;re adding new date-night activities all the time. Want to
            know the moment they drop?
          </p>
          <div className="mt-7 flex justify-center">
            <Button href="/how-it-works" size="lg">
              See how it works
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
