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
  pokeGlassField,
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
    glass.addBinding(g, "frost", rng(0, 1, 0.01));
    glass.addBinding(g, "frostBlur", rng(0, 1, 0.01));
    glass.addBinding(g, "distortion", rng(0, 1, 0.01));
    glass.addBinding(g, "distortionScale", rng(0, 2, 0.05));
    glass.addBinding(g, "temporalDistortion", rng(0, 0.3, 0.005));
    glass.addBinding(g, "clearcoat", rng(0, 1, 0.01));
    glass.addBinding(g, "clearcoatRoughness", rng(0, 1, 0.01));
    glass.addBinding(g, "emissive", rng(0, 0.5, 0.005));
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
    light.addBinding(l, "keyIntensity", rng(0, 3, 0.01));
    light.addBinding(l, "keyAngle", rng(0, 360, 1));
    light.addBinding(l, "keyElevation", rng(5, 90, 1));
    light.addBinding(l, "fillIntensity", rng(0, 1.5, 0.01));

    const depth = pane.addFolder({ title: "depth", expanded: false });
    const d = glassParams.depth;
    // The focus field and the DOM recession grade are read by motion
    // transforms that only re-evaluate when an input moves, so each of these
    // pokes the field channel; the GL-only knobs below skip it (the frame
    // loop reads them live).
    const poke = () => pokeGlassField();
    depth.addBinding(d, "focalLine", rng(0.1, 0.9, 0.01)).on("change", poke);
    depth.addBinding(d, "plateau", rng(0, 400, 5)).on("change", poke);
    depth.addBinding(d, "falloff", rng(40, 1000, 10)).on("change", poke);
    depth.addBinding(d, "curve", rng(0.5, 4, 0.05)).on("change", poke);
    depth.addBinding(d, "scaleMin", rng(0.5, 1, 0.005)).on("change", poke);
    depth.addBinding(d, "blurMax", rng(0, 20, 0.25)).on("change", poke);
    depth.addBinding(d, "opacityMin", rng(0.2, 1, 0.01)).on("change", poke);
    depth
      .addBinding(d, "wireOpacityMin", rng(0, 1, 0.01))
      .on("change", poke);
    depth.addBinding(d, "zSpread", rng(0, 400, 5));
    depth.addBinding(d, "focusRange", rng(20, 400, 5));
    depth.addBinding(d, "bokehScale", rng(0, 8, 0.1));
    depth.addBinding(d, "bokehResolution", rng(0.25, 1, 0.05));

    const wires = pane.addFolder({ title: "wires", expanded: false });
    const w = glassParams.wires;
    wires.addBinding(w, "coreGain", rng(0, 4, 0.05));
    wires.addBinding(w, "coreWidth", rng(0.5, 6, 0.1));
    wires.addBinding(w, "haloGain", rng(0, 0.6, 0.005));
    wires.addBinding(w, "haloWidth", rng(4, 28, 0.5));
    wires.addBinding(w, "pulseGain", rng(0, 4, 0.05));
    wires.addBinding(w, "pulseSpeed", rng(0, 500, 5));
    wires.addBinding(w, "pulseSpacing", rng(60, 800, 10));
    wires.addBinding(w, "pulseLength", rng(10, 300, 5));
    wires.addBinding(w, "floor", rng(0, 1, 0.01));
    wires.addBinding(w, "stagger", rng(0, 0.3, 0.01));
    wires.addBinding(w, "fadeIn", rng(0.05, 2, 0.05));
    wires.addBinding(w, "portGain", rng(0, 3, 0.05));
    wires.addBinding(w, "portSize", rng(6, 48, 1));
    wires.addBinding(w, "headGain", rng(0, 3, 0.05));
    wires.addBinding(w, "headSize", rng(6, 48, 1));
    wires.addBinding(w, "returnDim", rng(0, 1, 0.01));

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
