import { DocsLink } from "./docs-link";

/* The widening end of the funnel: concrete work, mostly coding, some not.
   Each card is honest about its state. "Ships today" is a flow that comes
   with Circuit and runs as written. "You compose it" is a shape Circuit can
   run once you assemble it from existing blocks, not a built-in flow. The tag
   is the promise, so it has to stay true: keep ships-today for flows actually
   in the host bundle, and compose-it for everything you'd describe and build.
   Ships-today cards link to the flow's docs page; compose-it cards share one
   link to the composing guide at the end of their row. */

type RunTag = "ships today" | "you compose it";

type RunExample = {
  name: string;
  body: string;
  tag: RunTag;
  link?: { href: string; label: string };
};

const CODING: RunExample[] = [
  {
    name: "Fix a flaky test without guessing",
    body: "Prove the failure, name the cause, make the smallest change, re-run to confirm.",
    tag: "ships today",
    link: { href: "/docs/flows/fix", label: "How Fix runs" },
  },
  {
    name: "Ship a change inside set limits",
    body: "State what must keep working, pause for your call, stay in bounds, verify, then review.",
    tag: "ships today",
    link: { href: "/docs/flows/build", label: "How Build runs" },
  },
  {
    name: "Compare a few approaches",
    body: "Fan out candidates in a tournament and stop for you to pick the winner.",
    tag: "ships today",
    link: { href: "/docs/flows/modes#tournament", label: "Tournament mode" },
  },
  {
    name: "Review a change before the PR",
    body: "A read-only, evidence-backed verdict on behavior, scope, and risk. It never edits the code.",
    tag: "ships today",
    link: { href: "/docs/flows/review", label: "How Review runs" },
  },
];

const BEYOND: RunExample[] = [
  {
    name: "Scrape pages into one clean dataset",
    body: "Pull each source, normalize to a typed shape, and reject the rows that don't match.",
    tag: "you compose it",
  },
  {
    name: "Research a topic into a cited brief",
    body: "Draft, then critique on a loop until every claim carries a source.",
    tag: "you compose it",
  },
  {
    name: "Audit a long document for one risk",
    body: "A read-only verdict on a named risk that never alters the source.",
    tag: "you compose it",
  },
];

function RunCard({ example }: { example: RunExample }) {
  const shipsToday = example.tag === "ships today";
  return (
    <article className="soft-info-card flex flex-col gap-3 p-5">
      <span
        className={[
          "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
          shipsToday
            ? "bg-signal/15 text-signal"
            : "bg-muted/60 text-muted-foreground",
        ].join(" ")}
      >
        {example.tag}
      </span>
      <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
        {example.name}
      </h3>
      <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {example.body}
      </p>
      {example.link ? (
        <DocsLink href={example.link.href}>{example.link.label}</DocsLink>
      ) : null}
    </article>
  );
}

function RunGroup({
  label,
  examples,
  footerLink,
}: {
  label: string;
  examples: RunExample[];
  footerLink?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {examples.map((example) => (
          <RunCard key={example.name} example={example} />
        ))}
      </div>
      {footerLink ? (
        <DocsLink href={footerLink.href}>{footerLink.label}</DocsLink>
      ) : null}
    </div>
  );
}

export function WhatYouCanRun() {
  return (
    <section className="mt-32 flex flex-col gap-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
          What you can run
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Mostly coding. Not only coding. Some flows come with Circuit; the rest
          you describe and compose.
        </p>
        <DocsLink href="/docs/flows/overview">
          Every flow that ships, in detail
        </DocsLink>
      </div>

      <RunGroup label="Coding" examples={CODING} />
      <RunGroup
        label="Beyond coding"
        examples={BEYOND}
        footerLink={{
          href: "/docs/concepts/how-flows-compose",
          label: "How you'd compose these",
        }}
      />
    </section>
  );
}
