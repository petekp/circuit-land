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
        "soft-cta-primary inline-flex min-h-10 w-fit items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium",
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
    <div className="install-terminal-card flex flex-col gap-4 p-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-balance text-[26px] font-medium leading-tight tracking-tight">
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
        {/* Collapsed, the prompt reads as one terminal line (newlines
            collapse, clamped to two lines); expanded, the real line
            structure comes back. */}
        <span className="install-prompt-well block w-full overflow-hidden px-4 py-3 font-mono text-[13px] leading-6 text-muted-foreground group-hover:text-foreground">
          <span
            className={
              expanded
                ? "block whitespace-pre-wrap break-words"
                : "line-clamp-2 whitespace-normal break-words"
            }
          >
            <span aria-hidden="true" className="text-signal">
              {"› "}
            </span>
            {text}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground group-hover:text-foreground">
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
