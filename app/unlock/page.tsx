import type { Metadata } from "next";
import UnlockForm from "@/components/UnlockForm";

export const metadata: Metadata = {
  title: "the key to my heart",
  robots: { index: false, follow: false },
};

export default function UnlockPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <span className="blob left-[-6%] top-[8%] h-72 w-72 bg-you/30 animate-float-slow" />
      <span className="blob right-[-6%] bottom-[6%] h-80 w-80 bg-me/25 animate-float-slow [animation-delay:-3s]" />

      <div className="relative w-full max-w-sm text-center">
        {/* Duotone heart-dots */}
        <div className="mx-auto flex items-center justify-center" aria-hidden="true">
          <span className="h-4 w-4 -mr-1.5 rounded-full bg-you" />
          <span className="h-4 w-4 rounded-full bg-me" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold leading-snug text-ink sm:text-4xl">
          enter the key to
          <br />
          my <span className="text-duo">heart</span>…
        </h1>
        <p className="mt-3 text-sm text-muted">
          this little corner of the internet is just for us.
        </p>

        <UnlockForm from={searchParams.from} />

        <p className="mt-8 text-xs lowercase tracking-[0.14em] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-you" />
            mygurm
            <span className="h-2 w-2 rounded-full bg-me" />
          </span>
        </p>
      </div>
    </div>
  );
}
