import type { Metadata } from "next";
import Pill from "@/components/Pill";
import Section from "@/components/Section";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = {
  title: "Photobooths",
  description: "Every four-cut strip you and me have taken together.",
  robots: { index: false, follow: false },
};

export default function PhotoboothsPage() {
  return (
    <Section className="pt-14 sm:pt-20">
      <div className="max-w-2xl">
        <Pill tone="you">our strips</Pill>
        <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">
          Every strip of <span className="text-duo">us</span>
        </h1>
        <p className="mt-5 text-lg text-muted">
          A growing keepsake of every four-cut we&apos;ve taken together — each
          one stamped with the date and sealed with G + R.
        </p>
      </div>

      <div className="mt-12">
        <Gallery mode="strips" />
      </div>
    </Section>
  );
}
