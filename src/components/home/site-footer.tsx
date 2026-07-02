import { GithubLogo, XLogo } from "./host-logos";

export function SiteFooter() {
  return (
    <footer className="mt-32 flex items-center justify-between gap-3 pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/petekp/circuit"
          aria-label="Circuit on GitHub"
          className="hover:text-foreground"
        >
          <GithubLogo />
        </a>
        <a
          href="https://x.com/petekp"
          aria-label="Pete Petrash on X"
          className="hover:text-foreground"
        >
          <XLogo />
        </a>
      </div>
      <a
        href="https://github.com/petekp/circuit/blob/main/LICENSE"
        className="hover:text-foreground"
      >
        Open Source
      </a>
    </footer>
  );
}
