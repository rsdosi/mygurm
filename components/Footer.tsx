import Link from "next/link";

const groups = [
  {
    title: "Product",
    links: [
      { href: "/timeline", label: "Our story" },
      { href: "/photobooths", label: "Photobooths" },
      { href: "/gallery", label: "Gallery" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "About" },
      { href: "/", label: "Contact" },
      { href: "/", label: "Privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto w-full max-w-content px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 text-lg font-semibold lowercase tracking-tight text-ink">
              <span aria-hidden="true" className="flex items-center">
                <span className="h-3 w-3 -mr-1 rounded-full bg-you" />
                <span className="h-3 w-3 rounded-full bg-me" />
              </span>
              mygurm
            </div>
            <p className="mt-3 text-sm text-muted">
              The activity hub for long-distance couples.{" "}
              <span className="text-ink">you</span> +{" "}
              <span className="text-ink">me</span>, together tonight.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {group.links.map((link, i) => (
                    <li key={`${link.label}-${i}`}>
                      <Link
                        href={link.href}
                        className="text-ink/80 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>mygurm · fun dates for long distance</p>
          <p>
            © {new Date().getFullYear()} mygurm. All rights reserved.{" "}
            <span className="text-ink">(she&apos;s all mine!)</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
