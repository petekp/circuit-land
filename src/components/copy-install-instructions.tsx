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
    <div className="soft-code-block overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Agent prompt
        </span>
        <button
          type="button"
          onClick={copyText}
          className="soft-cta-secondary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors"
        >
          {copyState === "copied" ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          <span aria-live="polite">{label}</span>
        </button>
      </div>
      <pre className="max-h-72 min-h-36 overflow-auto whitespace-pre-wrap break-words px-5 py-4 text-[13px] leading-6 text-foreground">
        <code>{text}</code>
      </pre>
    </div>
  );
}
