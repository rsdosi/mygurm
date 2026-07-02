import type { ElementType, ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Inner container className — control max width / spacing per section. */
  innerClassName?: string;
  as?: ElementType;
};

export default function Section({
  children,
  id,
  className = "",
  innerClassName = "",
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag id={id} className={`px-5 py-16 sm:px-6 sm:py-20 lg:py-24 ${className}`}>
      <div className={`mx-auto w-full max-w-content ${innerClassName}`}>
        {children}
      </div>
    </Tag>
  );
}
