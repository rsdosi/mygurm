"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "./Button";

const links = [
  { href: "/activities", label: "Activities" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

function Wordmark() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2 text-xl font-semibold lowercase tracking-tight text-ink"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center"
      >
        <span className="h-3 w-3 -mr-1 rounded-full bg-you transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span className="h-3 w-3 rounded-full bg-me transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
      mygurm
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-5 sm:px-6"
        aria-label="Primary"
      >
        <Wordmark />

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-7 text-sm text-muted">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button href="/" size="md">
            Create a room
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/70 text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 top-1 block h-0.5 w-5 rounded bg-ink transition-transform duration-200 ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute bottom-1 left-0 block h-0.5 w-5 rounded bg-ink transition-transform duration-200 ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-line bg-bg/95 px-5 pb-6 pt-2 md:hidden"
        >
          <ul className="flex flex-col divide-y divide-line">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-4">
            <Button
              href="/"
              size="lg"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Create a room
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
