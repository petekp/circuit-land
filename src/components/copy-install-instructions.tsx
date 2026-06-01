"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

function useCopyText(text: string) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function copyText() {
    let copied = false;

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "true");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      copied = document.execCommand("copy");
      document.body.removeChild(field);
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
  return (
    <div className="soft-info-card flex flex-col justify-between gap-5 p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-[15px] font-medium tracking-tight">
          Let your agent install it
        </h3>
        <p className="text-balance text-[12px] leading-relaxed text-muted-foreground">
          Copy one prompt that includes the Claude Code and Codex install paths,
          plus the first command to run after setup.
        </p>
      </div>
      <CopyTextButton text={text} label="Copy prompt" />
    </div>
  );
}
