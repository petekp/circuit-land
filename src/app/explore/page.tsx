import Link from "next/link";

const roundOne = [
  {
    href: "/explore/notation",
    name: "1 · Score / Notation",
    blurb:
      "Circuit is a score; the agent performs it. Kandinsky/Bauhaus print: points, lines, planes, flat saturated accents on cream.",
  },
  {
    href: "/explore/archival",
    name: "2 · Archival Print",
    blurb:
      "The whole site is the record. Paper-and-ink fine press: serif type, figures as numbered plates, warm ivory.",
  },
  {
    href: "/explore/course",
    name: "3 · Course / Racing Line",
    blurb:
      "Circuit is a course the agent runs. Asphalt dark, one hot signal color, condensed italics, a racing line that tightens.",
  },
];

const roundSix = [
  {
    href: "/explore/mark",
    name: "The mark, refined",
    blurb:
      "Gap, taken seriously: weight study (6/7/8), single-ink element variants waiting at the gate (dot, dash, pad, counter), the lap animation as a running state, and format proofs.",
  },
  {
    href: "/explore/aurora",
    name: "Aurora — full treatment",
    blurb:
      "Sodium's bones, verdict applied: Schibsted Grotesk prose, accent steered into green-turquoise-lime with a five-stop dial to fine-tune, single-ink animated header mark.",
  },
];

const roundFive = [
  {
    href: "/explore/stadium",
    name: "Stadium riffs",
    blurb:
      "Eight takes on the stadium mark where the marker is built into the track — gaps, dashes, start lines, seats, carves — judged at 12 and 16 px first. No floating dots.",
  },
  {
    href: "/explore/sodium",
    name: "Sodium — full treatment",
    blurb:
      "The acid yellow + Fragment Mono theme deep-riffed on the document bones: animated stadium mark, prose-face studies, and yellow's two registers (ink on dark, highlighter on light).",
  },
];

const roundFour = [
  {
    href: "/explore/marks-2",
    name: "Logomark sheet, round two",
    blurb:
      "Eight marks from wider formal families — route, letterform, clock signal, schematic, rotation. Ink-first; the blue is a placeholder.",
  },
  {
    href: "/explore/palettes-2",
    name: "Palette + type sheet, round two",
    blurb:
      "Six hue territories with zero warm-orange (that's Claude's lane), each with its own typeface pairing: acid yellow, azure, magenta, Swiss gray+red, CMY process inks, ultramarine serif.",
  },
];

const roundThree = [
  {
    href: "/explore/trace",
    name: "7 · Synthesis — Trace",
    blurb:
      "The recommendation: Ember's document bones + copper palette + the Loop & Step mark (animated). Ends with the north-star principles.",
  },
  {
    href: "/explore/marks",
    name: "Logomark sheet",
    blurb:
      "Eight geometric marks on the closed-loop brief — overlapping shapes, real negative space — each shown big, in lockup, and at favicon size.",
  },
  {
    href: "/explore/palettes",
    name: "Palette sheet",
    blurb:
      "Five riffs on the Ember document with type held constant: copper, harbor coral, violet control, persimmon, and a light wildcard.",
  },
];

const roundTwo = [
  {
    href: "/explore/ember",
    name: "4 · Ember",
    blurb:
      "Warm graphite, amber heat, coral marginalia. Document genre: repo header, badge chips, install as a command block, a real run as evidence.",
  },
  {
    href: "/explore/indigo",
    name: "5 · Indigo",
    blurb:
      "Night ink, periwinkle signal, peach marginalia. Same document bones as Ember, cooler temperature.",
  },
  {
    href: "/explore/tokens",
    name: "6 · Tokens",
    blurb:
      "A pastel editor theme as the palette: rose, gold, sky, lilac used like a syntax highlighter — small, semantic, never a wash.",
  },
];

export default function ExploreIndex() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-10 px-6 py-16 text-sm">
      <header className="flex flex-col gap-2">
        <h1 className="text-base font-medium">
          Circuit — visual direction explorations
        </h1>
        <p className="text-muted-foreground">
          Treatments of the same hero + gap chapter. Same copy, same
          animation system; only the visual language changes.
        </p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Round six — locking in: the Gap mark + Schibsted + the green dial
        </h2>
        <ul className="flex flex-col gap-6">
          {roundSix.map((t) => (
            <li key={t.href} className="flex flex-col gap-1">
              <Link href={t.href} className="font-medium underline">
                {t.name}
              </Link>
              <p className="text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Round five — converging: stadium mark + Sodium theme
        </h2>
        <ul className="flex flex-col gap-6">
          {roundFive.map((t) => (
            <li key={t.href} className="flex flex-col gap-1">
              <Link href={t.href} className="font-medium underline">
                {t.name}
              </Link>
              <p className="text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Round four — wider: new mark families, new hues, type variety
        </h2>
        <ul className="flex flex-col gap-6">
          {roundFour.map((t) => (
            <li key={t.href} className="flex flex-col gap-1">
              <Link href={t.href} className="font-medium underline">
                {t.name}
              </Link>
              <p className="text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Round three — overnight: mark, palette, synthesis
        </h2>
        <ul className="flex flex-col gap-6">
          {roundThree.map((t) => (
            <li key={t.href} className="flex flex-col gap-1">
              <Link href={t.href} className="font-medium underline">
                {t.name}
              </Link>
              <p className="text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Round two — document genre, dev-native dark
        </h2>
        <ul className="flex flex-col gap-6">
          {roundTwo.map((t) => (
            <li key={t.href} className="flex flex-col gap-1">
              <Link href={t.href} className="font-medium underline">
                {t.name}
              </Link>
              <p className="text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Round one — poles (superseded)
        </h2>
        <ul className="flex flex-col gap-6">
          {roundOne.map((t) => (
            <li key={t.href} className="flex flex-col gap-1">
              <Link href={t.href} className="font-medium underline">
                {t.name}
              </Link>
              <p className="text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
