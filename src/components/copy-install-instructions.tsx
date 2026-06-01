"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyInstallInstructions({ text }: { text: string }) {
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

  const label =
    copyState === "copied"
      ? "Copied"
      : copyState === "failed"
        ? "Copy failed"
        : "Copy";

  return (
    <div className="soft-info-card flex flex-col justify-between gap-5 p-5">
      <div className="flex flex-col gap-2">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Agent prompt
        </p>
        <h3 className="text-[15px] font-medium tracking-tight">
          Let the agent install it
        </h3>
        <p className="text-balance text-[12px] leading-relaxed text-muted-foreground">
          Copy one prompt that includes the Claude Code and Codex install paths,
          plus the first command to run after setup.
        </p>
      </div>
      <button
        type="button"
        onClick={copyText}
        className="soft-cta-primary inline-flex min-h-11 w-fit items-center gap-2 px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
      >
        {copyState === "copied" ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        <span aria-live="polite">{label}</span>
      </button>
    </div>
  );
}
