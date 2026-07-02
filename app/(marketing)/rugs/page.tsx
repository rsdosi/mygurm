import type { Metadata } from "next";
import Pill from "@/components/Pill";
import PetRugs from "@/components/PetRugs";

export const metadata: Metadata = {
  title: "Pet the Rugs",
  description:
    "Gurm gave me a stuffed cheetah named Rugs for my birthday. Pet him and he gets happy!",
  robots: { index: false, follow: false },
};

export default function RugsPage() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-5 pt-14 text-center sm:pt-16">
        <Pill tone="you" className="mx-auto">
          pet the rugs
        </Pill>
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">
          say hi to <span className="text-duo">Rugs</span>
        </h1>
        <p className="mt-4 text-muted">
          Gurm gave me this little stuffed cheetah named Rugs for my birthday.
          Give him a pet — he gets happy! 🐆💗
        </p>
      </div>
      <PetRugs />
    </div>
  );
}
