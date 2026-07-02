import Button from "@/components/Button";
import Pill from "@/components/Pill";
import Card from "@/components/Card";
import Section from "@/components/Section";
import RoomEntry from "@/components/RoomEntry";
import PhotoStripMockup from "@/components/PhotoStripMockup";
import { steps } from "@/lib/content";

export default function Home() {
  return (
    <>
      {/* Hero — the entry */}
      <Section
        className="relative overflow-hidden pt-14 sm:pt-16"
        innerClassName="relative"
      >
        <span className="blob left-[-8%] top-[-10%] h-72 w-72 bg-you/25 animate-float-slow" />
        <span className="blob right-[-6%] top-[4%] h-80 w-80 bg-me/20 animate-float-slow [animation-delay:-3s]" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <Pill tone="you" className="mx-auto lg:mx-0">
              photobooth for two
            </Pill>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.04] sm:text-6xl">
              a <span className="text-duo">photobooth</span> for
              <br className="hidden sm:block" /> you and me
            </h1>

            <p className="mx-auto mt-5 max-w-md text-lg text-muted lg:mx-0">
              Open a room and send the code. They&apos;ll be there in a tap.
            </p>

            <div className="lg:max-w-md">
              <RoomEntry />
            </div>

            <p className="mt-5 text-sm text-muted">
              Synced 4-cut strip · works across timezones · just the two of you
            </p>
          </div>

          <div className="order-first lg:order-last">
            <PhotoStripMockup />
          </div>
        </div>
      </Section>

      {/* How it works preview */}
      <Section className="bg-white">
        <div className="max-w-2xl">
          <Pill tone="me">how it works</Pill>
          <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
            From miles apart to one shared strip
          </h2>
          <p className="mt-4 text-lg text-muted">
            Four small steps to turn any night into a date night.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n}>
              <Card className="h-full">
                <span
                  className={`font-display text-4xl ${
                    s.tone === "you" ? "text-you" : "text-me"
                  }`}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Button href="/how-it-works" variant="ghost" size="lg">
            Read the full walkthrough
          </Button>
        </div>
      </Section>

      {/* Value props */}
      <Section className="bg-grid">
        <div className="max-w-2xl">
          <Pill tone="you">why mygurm</Pill>
          <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
            The distance is real. The date doesn&apos;t have to feel far.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: "⏱️",
              title: "Synced to the second",
              body: "The room runs an authoritative countdown so both cameras snap at the exact same instant.",
            },
            {
              icon: "🎀",
              title: "you + me, everywhere",
              body: "Pink is you, blue is me. A tiny duotone language that runs through every strip.",
            },
            {
              icon: "🖼️",
              title: "Keepsakes to download",
              body: "Every session ends with a full-resolution four-cut strip you can save and share.",
            },
            {
              icon: "🎥",
              title: "Live video, together",
              body: "See each other in real time while you pose — peer-to-peer, low latency.",
            },
            {
              icon: "🔒",
              title: "Just the two of you",
              body: "A private room capped at two. No feeds, no followers, no noise.",
            },
            {
              icon: "🌏",
              title: "Any distance",
              body: "One city over or halfway around the world — it works the same.",
            },
          ].map((f) => (
            <Card key={f.title} interactive>
              <div className="text-2xl" aria-hidden="true">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {f.body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="relative overflow-hidden rounded-card bg-ink px-6 py-16 text-center shadow-soft-lg sm:px-12 sm:py-20">
          <span className="blob left-[10%] top-[-20%] h-56 w-56 bg-you/40" />
          <span className="blob right-[8%] bottom-[-25%] h-64 w-64 bg-me/40" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
              Your next date is one tap away
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
              Open a room, send the code, and take four cuts together — no
              matter how many miles are between you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                href="/"
                size="lg"
                className="!bg-white !text-ink hover:!shadow-soft-lg"
              >
                Create a room
              </Button>
              <Button
                href="/faq"
                variant="ghost"
                size="lg"
                className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
              >
                Read the FAQ
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
