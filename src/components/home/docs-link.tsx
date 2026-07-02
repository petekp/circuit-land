import Link from "next/link";
import type { ReactNode } from "react";

/* The one visual register for "go deeper": a quiet text link with the signal
   chevron, the same mark the info cards use for their evidence lines. Sections
   use it to hand off to the docs at the moment a reader wants more detail,
   without competing with the install CTA that ends the funnel. */
export function DocsLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex w-fit items-baseline gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden className="text-signal">
        ›
      </span>
      <span className="underline-offset-4 group-hover:underline">
        {children}
      </span>
    </Link>
  );
}
