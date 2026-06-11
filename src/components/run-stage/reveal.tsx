"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Adds `is-live` to the wrapper the first time it scrolls into view, so
// the stage CSS inside can play its entrance choreography. Without
// JavaScript the class never lands and the stage simply renders in its
// designed resting state — default visible, never default hidden.
export function RunStageReveal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-live");
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        node.classList.add("is-live");
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
