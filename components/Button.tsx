import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-pill transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-me/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none select-none";

const sizes: Record<Size, string> = {
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3.5",
};

const variants: Record<Variant, string> = {
  // Primary: filled duotone-leaning ink button with a soft lift on hover
  primary:
    "bg-ink text-white shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0",
  // Ghost: secondary, quiet, outlined
  ghost:
    "bg-white/70 text-ink border border-line hover:border-ink/20 hover:bg-white",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Show the trailing "▷" glyph. Defaults to true for primary, false for ghost. */
  showArrow?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      ▷
    </span>
  );
}

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    showArrow,
    children,
    className = "",
    ...rest
  } = props;

  const withArrow = showArrow ?? variant === "primary";

  const classes = `group ${base} ${sizes[size]} ${variants[variant]} ${className}`;

  const content = (
    <>
      {children}
      {withArrow && <Arrow />}
    </>
  );

  if (typeof props.href === "string") {
    const { href, ...anchorRest } =
      rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link href={props.href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
