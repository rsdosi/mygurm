import type { Metadata } from "next";
import Button from "@/components/Button";
import Pill from "@/components/Pill";
import Section from "@/components/Section";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ — mygurm",
  description:
    "Answers about mygurm — the activity hub for long-distance couples. What it is, the pink-and-blue duotone, timezones, and availability.",
};

export default function FaqPage() {
  return (
    <>
      <Section className="relative overflow-hidden pt-14 sm:pt-20">
        <span className="blob left-[-6%] top-[-8%] h-64 w-64 bg-you/20" />
        <div className="relative max-w-2xl">
          <Pill tone="me">faq</Pill>
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl lg:text-6xl">
            The <span className="text-duo">questions</span> couples ask
          </h1>
          <p className="mt-5 text-lg text-muted">
            Everything you and me might want to know before your first date on
            mygurm.
          </p>
        </div>
      </Section>

      <Section className="!pt-0" innerClassName="max-w-3xl">
        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-soft">
          {faqs.map((item, i) => (
            <details key={i} className="group px-6 py-5 sm:px-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="text-lg font-semibold text-ink">
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-muted">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-card bg-ink p-8 text-center sm:p-10">
          <h2 className="text-2xl font-semibold text-white">
            Still curious?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-white/70">
            The best way to get it is to see it. Take a look at what you and me
            can do together.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              href="/activities"
              size="lg"
              className="!bg-white !text-ink"
            >
              Browse activities
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
