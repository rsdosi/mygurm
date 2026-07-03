import type { Metadata } from "next";
import UnlockForm from "@/components/UnlockForm";

export const metadata: Metadata = {
  title: "just us",
  robots: { index: false, follow: false },
};

export default function UnlockPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <span className="blob left-[-8%] top-[6%] h-72 w-72 bg-you/30 animate-float-slow" />
      <span className="blob right-[-8%] bottom-[6%] h-80 w-80 bg-me/25 animate-float-slow [animation-delay:-3s]" />

      <div className="relative w-full max-w-sm text-center">
        {/* G + R heart */}
        <div className="relative mx-auto h-20 w-20 animate-float-slow">
          <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-[0_10px_20px_rgba(255,92,138,0.35)]">
            <path
              d="M12 21s-7.5-4.7-9.8-9C.7 9 2 5.5 5.2 5.5c2 0 3.2 1.2 3.9 2.4l.9 1.5.9-1.5c.7-1.2 1.9-2.4 3.9-2.4 3.2 0 4.5 3.5 3 6.5-2.3 4.3-9.8 9-9.8 9z"
              fill="#FF5C8A"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center pb-1 font-display text-lg font-semibold text-white">
            G + R
          </span>
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold leading-snug text-ink sm:text-4xl">
          hi, it&apos;s just{" "}
          <span className="text-you">you</span> &amp;{" "}
          <span className="text-me">me</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xs text-[15px] leading-relaxed text-muted">
          you found our little corner of the internet, love. every chipotle run,
          every four-cut, and Rugs waiting to be pet — it&apos;s all in here.
          sign in and stay a while. 💗
        </p>

        <UnlockForm from={searchParams.from} />

        <p className="mt-8 text-xs lowercase tracking-[0.14em] text-muted">
          made with{" "}
          <span className="inline-flex items-center gap-1 align-middle">
            <span className="h-2 w-2 rounded-full bg-you" />
            <span className="h-2 w-2 rounded-full bg-me" />
          </span>{" "}
          · mygurm · since 03·06
        </p>
      </div>
    </div>
  );
}
