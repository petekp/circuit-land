import { FlowExplorer } from "@/components/home/flow-explorer";

// Dev-only refinement surface for the focus treatment (now the live hero, see
// components/home/hero.tsx). Open /preview/flow-tour in `npm run dev` to refine
// it in isolation, without the masthead and the rest of the page. Click a
// feature in the nav and watch the diagram slide so its steps land in view
// while the nav and blurb stay put; the diagram opens with the run's prompt
// drawn as a terminal bar, then the steps. Resize the window to watch it drop
// to two then one column and take on its mobile shape. The shared variant
// machinery (spotlight, glow) still lives in flow-explorer.tsx and is now
// unused by any route — fold it down when convenient.

export default function FlowTourPreview() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Flow tour — focus
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          A vertical feature nav on the left, the diagram in the center, the
          explanation on the right. Click a feature to highlight where it lives;
          the diagram slides to bring its steps into view while the nav and blurb
          stay put. The diagram opens with the run&rsquo;s prompt as a terminal
          bar. Resize narrow to see the mobile shape: tabs on top, blurb below,
          the same sliding window underneath.
        </p>
      </header>
      <FlowExplorer variant="focus" />
    </main>
  );
}
