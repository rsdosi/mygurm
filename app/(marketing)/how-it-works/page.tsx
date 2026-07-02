import type { Metadata } from "next";
import Button from "@/components/Button";
import Pill from "@/components/Pill";
import Card from "@/components/Card";
import Section from "@/components/Section";
import { steps } from "@/lib/content";

export const metadata: Metadata = {
  title: "How it works — mygurm",
  description:
    "How mygurm turns any night into a date night for long-distance couples: set up you + me, pick an activity, do it together across timezones, and keep the memory.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Section className="relative overflow-hidden pt-14 sm:pt-20">
        <span className="blob right-[-6%] top-[-8%] h-72 w-72 bg-me/25" />
        <div className="relative max-w-2xl">
          <Pill tone="me">how it works</Pill>
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl lg:text-6xl">
            One shared moment, in <span className="text-duo">four</span> steps
          </h1>
          <p className="mt-5 text-lg text-muted">
            mygurm is built around two people in two places. Here&apos;s how a
            night together comes together.
          </p>
        </div>
      </Section>

      <Section className="!pt-0">
        <ol className="grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <li key={s.n}>
              <Card className="flex h-full gap-5">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-2xl ${
                    s.tone === "you"
                      ? "bg-you-soft text-you-ink"
                      : "bg-me-soft text-me-ink"
                  }`}
                >
                  {s.n}
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{s.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* you + me explainer */}
      <Section className="bg-white">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Pill tone="you">the duotone</Pill>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Pink is you. Blue is me.
            </h2>
            <p className="mt-4 text-lg text-muted">
              That little bit of color coding runs through everything in mygurm.
              It&apos;s how a shared canvas knows whose stroke is whose, how a
              quiz keeps score, and how every keepsake remembers who was where.
            </p>
            <p className="mt-4 text-lg text-muted">
              Two colors, one moment — meeting somewhere in the middle.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-card border border-line shadow-soft">
            <div className="grid grid-cols-2">
              <div className="bg-you-soft p-8">
                <Pill tone="you">you</Pill>
                <p className="mt-4 font-display text-2xl">pink</p>
                <p className="mt-1 text-sm text-muted">#FF5C8A</p>
              </div>
              <div className="bg-me-soft p-8">
                <Pill tone="me">me</Pill>
                <p className="mt-4 font-display text-2xl">blue</p>
                <p className="mt-1 text-sm text-muted">#3B7DFF</p>
              </div>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-you to-me" />
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="rounded-card border border-line bg-white p-8 text-center shadow-soft sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Ready to try it together?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Take a look at the activity hub and pick the first thing you and me
            will do tonight.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/activities" size="lg">
              Browse activities
            </Button>
            <Button href="/faq" variant="ghost" size="lg">
              Read the FAQ
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
