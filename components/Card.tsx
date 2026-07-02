import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Adds a subtle hover lift — nice for interactive/linked cards. */
  interactive?: boolean;
  as?: "div" | "article" | "li";
};

export default function Card({
  children,
  className = "",
  interactive = false,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={`rounded-card border border-line bg-white p-6 shadow-soft sm:p-7 ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
          : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
