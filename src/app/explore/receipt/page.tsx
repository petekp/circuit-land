import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fragment_Mono, Schibsted_Grotesk } from "next/font/google";

export const metadata: Metadata = {
  title: "Proposal — one real run as the page's spine",
};

// PROPOSAL MOCK — not shippable content.
//
// This page shows the shape of the "one real run" fix for the landing
// page's proof gap: a single verbatim Fix run, used twice. The Example
// Run terminal ends in the run's actual closing receipt instead of
// status spinners, and the record section shows the same run's record
// with a link to the committed file on GitHub.
//
// Every run-shaped string below is MOCK content standing in for the
// real run's output. Nothing ships until a real run produces it.

const prose = Schibsted_Grotesk({
  variable: "--font-prose",
  subsets: ["latin"],
});

const evidence = Fragment_Mono({
  variable: "--font-evidence",
  weight: "400",
  subsets: ["latin"],
});

// ---------------------------------------------------------------------------
// Mock run content. One story, told twice: the terminal view and the record.

const runCommand =
  "/circuit:run fix customers get double-charged when checkout retries";

const runLines: { text: string; kind?: "dim" | "bright" }[] = [
  { text: "CIRCUIT", kind: "bright" },
  { text: "⎿ Chose the Fix flow · depth medium" },
  { text: "⎿ Reproducing the bug..." },
  { text: "⎿ Reproduced: a failing test captures the double charge." },
  { text: "⎿ Diagnosing..." },
  { text: "⎿ Cause: checkout retry mints a fresh idempotency key." },
  { text: "⎿ Asking the specialist to make the change..." },
  { text: "⎿ Verifying..." },
  { text: "⎿ Verification passed. Regression test cleared." },
  { text: "⎿ Review accepted. One residual risk flagged." },
];

// Receipt rules the mock demonstrates: no count without content (one
// risk is one line, printed; many risks show the first plus "+n more
// in the record"), and no naked "passed" (name what ran). Verdict
// words carry the signal ink; their elaborations stay quiet.
const receiptRows: { key: string; value: string; lit?: boolean; detail?: string }[] = [
  { key: "outcome", value: "fixed", lit: true },
  { key: "regression", value: "proved", lit: true, detail: "the failing test now passes" },
  { key: "checks", value: "passed", lit: true, detail: "tests, lint, build" },
  {
    key: "residual",
    value: "refund path bypasses the idempotency key; flagged, not changed",
  },
  {
    key: "record",
    value: ".circuit/runs/fix-checkout-retry/result.json",
  },
];

const recordExcerpt = `{
  "summary": "Fix 'customers get double-charged when checkout retries': capture now reuses the order's idempotency key, so a retry settles on the original charge.",
  "outcome": "fixed",
  "regression_status": "proved",
  "verification_status": "passed",
  "review_status": "completed",
  "residual_risks": ["The refund path bypasses the idempotency key; flagged, not changed here."],
  "evidence_links": [
    { "report_id": "fix.diagnosis", "path": "reports/fix/diagnosis.json" },
    { "report_id": "fix.regression-proof", "path": "reports/fix/regression-proof.json" },
    { "report_id": "fix.verification", "path": "reports/fix/verification.json" },
    { "report_id": "fix.change-set", "path": "reports/fix/change-set.json" },
    … 5 more
  ]
}`;

const recordStatusInk: Record<string, string> = {
  passed: "text-signal",
  fixed: "text-signal",
  proved: "text-signal",
  completed: "text-signal",
};

function RecordLine({ line }: { line: string }) {
  const m = line.match(/^(\s*)"([^"]+)": (.*?)(,?)$/);
  if (!m) {
    return <span className="block text-muted-foreground/70">{line}</span>;
  }
  const [, indent, key, value, comma] = m;
  const bareValue = value.match(/^"(.*)"$/)?.[1];
  const ink =
    bareValue !== undefined && recordStatusInk[bareValue]
      ? recordStatusInk[bareValue]
      : "text-foreground";
  return (
    <span className="block">
      {indent}
      <span className="text-muted-foreground">&quot;{key}&quot;</span>
      <span className="text-muted-foreground/70">: </span>
      <span className={ink}>{value}</span>
      <span className="text-muted-foreground/70">{comma}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Annotation furniture: design notes that must never read as page content.

function DesignNote({ n, children }: { n: number; children: ReactNode }) {
  return (
    <aside className="flex max-w-2xl gap-3 border-l-2 border-signal/60 pl-4">
      <span className="font-mono text-[12px] leading-relaxed text-signal">
        note {n}
      </span>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {children}
      </p>
    </aside>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-sans text-[17px] font-semibold tracking-tight text-foreground sm:text-[19px]">
      {children}
    </h2>
  );
}

export default function ReceiptProposalPage() {
  return (
    <div
      className={`${prose.variable} ${evidence.variable} min-h-screen bg-background font-sans text-foreground`}
    >
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        {/* ----------------------------------------------------------- */}
        <header className="flex max-w-3xl flex-col gap-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-signal">
            proposal mock · not page content
          </p>
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            One real run as the page&apos;s spine
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            One verbatim Fix run, used twice. The Example Run terminal ends in
            the run&apos;s actual closing receipt, and the record section
            shows the same run&apos;s record with a link to the committed
            file. Every run-shaped string on this page is a stand-in: the
            shipped version is pasted from a real run, imperfections
            included.
          </p>
        </header>

        {/* ----------------------------------------------------------- */}
        {/* Mock A: the With Circuit terminal, ending in the receipt.    */}
        <section className="mt-20 flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-3">
            <Label>A · The &quot;With Circuit&quot; terminal ends in the receipt</Label>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Today this panel ends with &quot;Build complete. Verification
              passed, review accepted.&quot; That is a claim. Here the run
              closes the way real runs close: with the receipt.
            </p>
          </div>

          <div className="example-run-panel max-w-3xl">
            <div className="example-run-panel-content p-6">
              <div className="run-terminal flex w-full flex-col overflow-hidden">
                <div className="example-run-terminal-chrome" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="flex flex-col px-5 py-4 font-mono text-[13px] leading-7">
                  <span className="example-run-user-row text-foreground">
                    {runCommand}
                  </span>
                  {runLines.map((line) => (
                    <span
                      key={line.text}
                      className={
                        line.kind === "bright"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {line.text}
                    </span>
                  ))}
                  <span className="mt-4 text-foreground">⎿ Fix complete.</span>
                  <div className="mt-1 flex flex-col">
                    {receiptRows.map((row) => (
                      <span key={row.key} className="flex gap-0">
                        <span className="w-36 shrink-0 text-muted-foreground/70">
                          {row.key}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={
                              row.lit ? "text-signal" : "text-foreground"
                            }
                          >
                            {row.value}
                          </span>
                          {row.detail && (
                            <span className="text-muted-foreground">
                              {" · "}
                              {row.detail}
                            </span>
                          )}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DesignNote n={1}>
            The receipt is the run&apos;s own closing output, pasted verbatim,
            not marketing copy in terminal costume. Two rules keep it honest:
            no count without content (the residual risk is printed, not
            tallied; several risks would show the first plus &quot;+n more in
            the record&quot;), and no naked &quot;passed&quot; (every verdict
            names what ran). Verdict words carry the signal ink; their
            elaborations stay quiet.
          </DesignNote>
        </section>

        {/* ----------------------------------------------------------- */}
        {/* Mock B: the record section, same run, linked to GitHub.      */}
        <section className="mt-20 flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-3">
            <Label>B · The record section shows the same run, with the link</Label>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Second view of the same run. The record stops being a
              &quot;representative example&quot; and becomes a quote from a
              file anyone can open.
            </p>
          </div>

          <figure className="flex w-full max-w-3xl flex-col gap-3">
            <div className="install-terminal-card overflow-hidden">
              <pre className="whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12px] leading-6 text-foreground">
                <code>
                  {recordExcerpt.split("\n").map((line, index) => (
                    <RecordLine key={index} line={line} />
                  ))}
                </code>
              </pre>
            </div>
            <figcaption className="flex flex-col gap-1 text-[12px] leading-relaxed text-muted-foreground">
              <span>
                Verbatim from the run above, trimmed to the load-bearing
                fields. Each evidence link names a report the run wrote along
                the way.
              </span>
              <a
                href="#mock-link"
                className="w-fit font-medium text-foreground underline decoration-foreground/40 underline-offset-4 hover:decoration-foreground"
              >
                Read the full record on GitHub →
              </a>
            </figcaption>
          </figure>

          <DesignNote n={2}>
            The GitHub link is the whole trick: it points at the record file
            committed in the Circuit repo, so every claim on the page becomes
            checkable. The caption says &quot;verbatim&quot; and
            &quot;trimmed&quot;, never &quot;representative&quot;. (The link
            here is a dead mock.)
          </DesignNote>
        </section>

        {/* ----------------------------------------------------------- */}
        <section className="mt-20 flex max-w-3xl flex-col gap-5 pb-16">
          <Label>What has to be true before this ships</Label>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[14px] leading-relaxed text-muted-foreground">
            <li>
              A real bug gets fixed through the Fix flow in the Circuit repo,
              at a depth that produces the full record, and the record is
              committed.
            </li>
            <li>
              The terminal tail and the record excerpt are both pasted from
              that run. Trimming is allowed; authoring is not.
            </li>
            <li>
              Whatever imperfection the run has stays on the page: a rerun
              check, a residual risk, a partial.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
