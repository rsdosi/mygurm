import type { Metadata } from "next";
import Pill from "@/components/Pill";
import Section from "@/components/Section";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Every photo and video of you and me.",
  robots: { index: false, follow: false },
};

export default function GalleryPage() {
  return (
    <Section className="pt-14 sm:pt-20">
      <div className="max-w-2xl">
        <Pill tone="me">our album</Pill>
        <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">
          Pictures of <span className="text-duo">us</span>
        </h1>
        <p className="mt-5 text-lg text-muted">
          A shared album of our favorite photos and videos. Add as many as you
          like — this is just for us.
        </p>
      </div>

      <div className="mt-12">
        <Gallery mode="uploads" />
      </div>
    </Section>
  );
}
