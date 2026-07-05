"use client";

/* The live tuning panel: tweakpane bindings straight onto glassParams. A
   slider drag mutates the shared object in place and the GL frame loop reads
   the new number on its next frame — React never re-renders. The one
   structural knob is post.enabled (mounts/unmounts the composer), so its
   binding bumps the params version.

   Mounted by glass-canvas: every dev build, production behind ?tune. This
   file and tweakpane ride the same lazy chunk, absent from the visitor
   bundle. */

import { useEffect } from "react";
import { Pane } from "tweakpane";
import {
  bumpGlassParams,
  glassParams,
  resetGlassParams,
} from "./glass-params";

const rng = (min: number, max: number, step: number) => ({ min, max, step });

export default function GlassTune() {
  useEffect(() => {
    // Own fixed container: tweakpane's default placement sits under the
    // site header's stacking context, and the page behind is one long
    // scroll — the panel has to hold the corner.
    const holder = document.createElement("div");
    holder.style.cssText =
      "position:fixed;top:12px;right:12px;z-index:2147483000;width:300px;" +
      "max-height:calc(100dvh - 24px);overflow:auto;" +
      "overscroll-behavior:contain;";
    document.body.appendChild(holder);
    const pane = new Pane({ container: holder, title: "glass tuning" });

    const glass = pane.addFolder({ title: "glass" });
    const g = glassParams.glass;
    glass.addBinding(g, "transmission", rng(0, 1, 0.01));
    glass.addBinding(g, "thickness", rng(0, 80, 1));
    glass.addBinding(g, "ior", rng(1, 1.8, 0.01));
    glass.addBinding(g, "chromaticAberration", rng(0, 0.3, 0.005));
    glass.addBinding(g, "anisotropicBlur", rng(0, 1, 0.01));
    glass.addBinding(g, "distortion", rng(0, 1, 0.01));
    glass.addBinding(g, "distortionScale", rng(0, 2, 0.05));
    glass.addBinding(g, "temporalDistortion", rng(0, 0.3, 0.005));
    glass.addBinding(g, "roughnessFocused", rng(0, 1, 0.01));
    glass.addBinding(g, "roughnessReceded", rng(0, 1, 0.01));
    glass.addBinding(g, "dimReceded", rng(0.3, 1, 0.01));
    glass.addBinding(g, "baseLift", rng(0, 0.5, 0.005));

    const tints = pane.addFolder({ title: "tints", expanded: false });
    const t = glassParams.tints;
    tints.addBinding(t, "step", rng(0, 1, 0.01));
    tints.addBinding(t, "checkpoint", rng(0, 1, 0.01));
    tints.addBinding(t, "loop", rng(0, 1, 0.01));
    tints.addBinding(t, "prompt", rng(0, 1, 0.01));
    tints.addBinding(t, "promptDarken", rng(0.2, 1, 0.01));

    const light = pane.addFolder({ title: "light", expanded: false });
    const l = glassParams.light;
    light.addBinding(l, "ambient", rng(0, 2, 0.01));
    light.addBinding(l, "key", rng(0, 3, 0.01));
    light.addBinding(l, "glowGain", rng(0, 0.6, 0.002));
    light.addBinding(l, "poolGain", rng(0, 0.5, 0.002));
    light.addBinding(l, "poolHeight", rng(100, 1200, 10));

    const wires = pane.addFolder({ title: "wires", expanded: false });
    const w = glassParams.wires;
    wires.addBinding(w, "gain", rng(0, 0.5, 0.005));
    wires.addBinding(w, "returnGain", rng(0, 0.3, 0.005));
    wires.addBinding(w, "floor", rng(0, 1, 0.01));
    wires.addBinding(w, "halfWidth", rng(1, 16, 0.5));
    wires.addBinding(w, "portGain", rng(0, 1, 0.01));
    wires.addBinding(w, "headGain", rng(0, 1, 0.01));
    wires.addBinding(w, "portSize", rng(4, 48, 1));
    wires.addBinding(w, "headSize", rng(4, 48, 1));
    wires.addBinding(w, "stagger", rng(0, 0.3, 0.01));
    wires.addBinding(w, "fadeIn", rng(0.05, 2, 0.05));

    const post = pane.addFolder({ title: "post", expanded: false });
    const po = glassParams.post;
    post.addBinding(po, "enabled").on("change", () => bumpGlassParams());
    post.addBinding(po, "bloomIntensity", rng(0, 2, 0.01));
    post.addBinding(po, "bloomThreshold", rng(0, 0.5, 0.005));
    post.addBinding(po, "bloomSmoothing", rng(0, 1, 0.01));
    post.addBinding(po, "grainOpacity", rng(0, 0.3, 0.005));

    // The handoff: dial the look in, copy the JSON, paste over
    // GLASS_DEFAULTS in glass-params.ts to commit it.
    pane.addButton({ title: "log + copy JSON" }).on("click", () => {
      const json = JSON.stringify(glassParams, null, 2);
      console.log(json);
      void navigator.clipboard?.writeText(json).catch(() => {});
    });
    pane.addButton({ title: "reset to defaults" }).on("click", () => {
      resetGlassParams();
      pane.refresh();
    });

    return () => {
      pane.dispose();
      holder.remove();
    };
  }, []);

  return null;
}
