"use client";

import { Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";

function useCopyText(text: string) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function copyText() {
    let copied = false;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }

    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return { copyState, copyText };
}

export function CopyTextButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  failedLabel = "Copy failed",
  className = "",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  failedLabel?: string;
  className?: string;
}) {
  const { copyState, copyText } = useCopyText(text);

  const visibleLabel =
    copyState === "copied"
      ? copiedLabel
      : copyState === "failed"
        ? failedLabel
        : label;

  return (
    <button
      type="button"
      onClick={copyText}
      className={[
        "soft-cta-primary inline-flex min-h-10 w-fit items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-90",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {copyState === "copied" ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      <span aria-live="polite">{visibleLabel}</span>
    </button>
  );
}

export function CopyInstallInstructions({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="soft-info-card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium tracking-tight">
          Let your agent install it
        </h3>
        <CopyTextButton
          text={text}
          label="Copy prompt"
          className="shrink-0 min-h-8 px-3 py-1.5 text-[12px]"
        />
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="group flex w-full flex-col items-start gap-2 text-left"
      >
        <span
          className={[
            "block w-full overflow-hidden whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-muted-foreground transition-colors group-hover:text-foreground",
            expanded ? "max-h-none" : "max-h-[4.5rem]",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {text}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground">
          {expanded ? "Show less" : "Show full prompt"}
          <ChevronDown
            aria-hidden="true"
            className={[
              "size-3.5 transition-transform",
              expanded ? "rotate-180" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </span>
      </button>
    </div>
  );
}
