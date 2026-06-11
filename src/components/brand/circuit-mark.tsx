/**
 * The Circuit mark: a stadium track opened by a gate on the right cap.
 *
 * Single-ink by design — the mark draws in currentColor so it survives any
 * format (favicon, terminal, print, embroidery). Color is styling, applied
 * by whoever places it.
 *
 * Three states:
 * - "track":   the opened track alone. For tiny placements (favicons,
 *              16px chrome) where the gate dot would smear.
 * - "rest":    track + the runner waiting at the gate. The default mark.
 * - "running": the runner lights in the brand signal color and laps the
 *              track. The accent is allowed here because a running state is
 *              product UI, not a logo placement — and a same-ink runner
 *              would be invisible against the track. Reduced motion parks
 *              it at the gate (the keyframes in globals.css are wrapped in
 *              a no-preference media query).
 *
 * Geometry: a 64-unit viewBox, stroke 8, path normalized to pathLength=100
 * so dash offsets are percentages of the lap. Offsets center the gate on
 * the right cap (s≈31.3 along the path).
 */

const STADIUM_D = "M 23 15 H 41 A 17 17 0 0 1 41 49 H 23 A 17 17 0 0 1 23 15 Z";

type CircuitMarkProps = {
  size?: number;
  state?: "track" | "rest" | "running";
  className?: string;
};

export function CircuitMark({
  size = 32,
  state = "rest",
  className,
}: CircuitMarkProps) {
  // The track-only state closes the gap slightly (12 vs 16) since there is
  // no runner to make room for.
  const gap = state === "track" ? 12 : 16;
  const dashoffset = state === "track" ? 62.7 : 60.7;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        d={STADIUM_D}
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${100 - gap} ${gap}`}
        strokeDashoffset={dashoffset}
      />
      {state === "rest" && <circle cx={58} cy={32} r={4} fill="currentColor" />}
      {state === "running" && (
        <path
          className="circuit-mark-lap"
          d={STADIUM_D}
          fill="none"
          stroke="var(--signal)"
          strokeWidth={8}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="0.1 99.9"
          strokeDashoffset={68.7}
        />
      )}
    </svg>
  );
}
