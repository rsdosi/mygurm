/** Decorative "인생네컷" four-cut strip mockup for the hero. Purely visual. */
const faces: [string, string][] = [
  ["🥰", "😎"],
  ["😊", "😄"],
  ["😗", "🤩"],
  ["🥳", "😂"],
];

export default function PhotoStripMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <span className="blob left-[-18%] top-[10%] h-40 w-40 bg-you/30" />
      <span className="blob right-[-18%] bottom-[6%] h-44 w-44 bg-me/30" />
      <div className="relative rotate-[2deg] rounded-card border border-line bg-white p-4 shadow-soft-lg animate-float-slow">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 pb-3 font-display text-lg font-semibold text-ink">
          <span className="h-2.5 w-2.5 rounded-full bg-you" />
          you
          <span className="text-muted">+</span>
          me
          <span className="h-2.5 w-2.5 rounded-full bg-me" />
        </div>

        {/* Cuts */}
        <div className="flex flex-col gap-2.5">
          {faces.map(([a, b], i) => (
            <div key={i} className="grid grid-cols-2 gap-2.5">
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-you-soft text-3xl">
                <span aria-hidden="true">{a}</span>
              </div>
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-me-soft text-3xl">
                <span aria-hidden="true">{b}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 text-center">
          <p className="font-display text-base font-semibold text-ink">
            mygurm
          </p>
          <p className="text-[11px] tracking-wide text-muted">
            인생네컷 · MYGRM
          </p>
        </div>
      </div>
    </div>
  );
}
