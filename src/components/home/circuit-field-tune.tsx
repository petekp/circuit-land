"use client";

import { DialRoot, DialStore, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { useEffect, useRef } from "react";

import {
  CIRCUIT_FIELD_CHOREOGRAPHY_PRESETS,
  CIRCUIT_FIELD_TUNE_EVENT,
  type CircuitFieldChoreographyPreset,
  circuitFieldParams,
} from "./circuit-field-params";

const PRESET_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Current", value: "current" },
  { label: "Depth Cascade", value: "depthCascade" },
];

function applyChoreographyPreset(presetName: CircuitFieldChoreographyPreset) {
  const panel = DialStore.getPanels().find(({ name }) => name === "Circuit field");
  if (!panel) return;

  const preset = CIRCUIT_FIELD_CHOREOGRAPHY_PRESETS[presetName];
  const updates = {
    "focus.rackSpeed": preset.rackSpeed,
    "focus.aperture": preset.aperture,
    "focus.minBlur": preset.minBlur,
    "layers.lifetime": preset.lifetime,
    "movement.sweepSpeed": preset.sweepSpeed,
    "movement.band": preset.band,
    "movement.gapMult": preset.gapMult,
    "movement.floor": preset.floor,
    "movement.timeScale": preset.timeScale,
    "movement.breathe": preset.breathe,
    "movement.sweepDirection": preset.sweepDirection,
    "movement.phaseMode": preset.phaseMode,
    "movement.depthOrder": preset.depthOrder,
    "movement.depthStagger": preset.depthStagger,
    "movement.sweepDuration": preset.sweepDuration,
    "movement.sweepGap": preset.sweepGap,
    "movement.edgePadding": preset.edgePadding,
    "movement.timingVariation": preset.timingVariation,
    "movement.wireFlow": preset.wireFlow,
    "color.exposure": preset.exposure,
  };

  for (const [path, value] of Object.entries(updates)) {
    DialStore.updateValue(panel.id, path, value);
  }
}

function CircuitFieldControls() {
  const values = useDialKit(
    "Circuit field",
    {
      choreography: {
        type: "select",
        options: PRESET_OPTIONS,
        default: "depthCascade",
      },
      quality: {
        resolution: [circuitFieldParams.resolution, 0.75, 3, 0.25],
        maxFps: [circuitFieldParams.maxFps, 0, 60, 1],
        pauseWhenHidden: circuitFieldParams.pauseWhenHidden,
        cacheGeometry: circuitFieldParams.cacheGeometry,
        batchBlur: circuitFieldParams.batchBlur,
        blurGroups: [circuitFieldParams.blurGroups, 1, 4, 1],
      },
      camera: {
        fov: [circuitFieldParams.fov, 8, 45, 0.5],
        dolly: [circuitFieldParams.dolly, 0.8, 3, 0.01],
        spacing: [circuitFieldParams.spacing, 0.2, 2.5, 0.01],
        tiltFrom: [circuitFieldParams.tiltFrom, -80, 80, 1],
        tiltTo: [circuitFieldParams.tiltTo, -80, 80, 1],
      },
      focus: {
        rackSpeed: [circuitFieldParams.rackSpeed, 0, 0.15, 0.001],
        aperture: [circuitFieldParams.aperture, 0, 30, 0.25],
        falloff: [circuitFieldParams.falloff, 0.5, 6, 0.1],
        minBlur: [circuitFieldParams.minBlur, 0, 8, 0.1],
      },
      layers: {
        count: [circuitFieldParams.count, 1, 18, 1],
        scaleMin: [circuitFieldParams.scaleMin, 0.25, 2, 0.01],
        scaleMax: [circuitFieldParams.scaleMax, 0.25, 2.5, 0.01],
        coverageMin: [circuitFieldParams.coverageMin, 0.4, 1.2, 0.01],
        coverageMax: [circuitFieldParams.coverageMax, 0.5, 1.5, 0.01],
        depthSizeCompensation: [circuitFieldParams.depthSizeCompensation, 0, 1, 0.01],
        stroke: [circuitFieldParams.stroke, 0.5, 6, 0.1],
        curviness: [circuitFieldParams.curviness, 0, 1, 0.01],
        taper: [circuitFieldParams.taper, 0.02, 0.75, 0.01],
        elbow: [circuitFieldParams.elbow, 0, 1, 0.01],
        elbowMid: [circuitFieldParams.elbowMid, 0.1, 0.9, 0.01],
        elbowRound: [circuitFieldParams.elbowRound, 0, 100, 1],
        lifetime: [circuitFieldParams.lifetime, 4, 40, 0.5],
      },
      movement: {
        sweepDirection: {
          type: "select",
          options: [
            { label: "Mixed", value: "mixed" },
            { label: "Top to bottom", value: "topToBottom" },
            { label: "Bottom to top", value: "bottomToTop" },
          ],
          default: circuitFieldParams.sweepDirection,
        },
        phaseMode: {
          type: "select",
          options: [
            { label: "Random", value: "random" },
            { label: "Depth cascade", value: "depth" },
          ],
          default: circuitFieldParams.phaseMode,
        },
        depthOrder: {
          type: "select",
          options: [
            { label: "Near to far", value: "nearToFar" },
            { label: "Far to near", value: "farToNear" },
          ],
          default: circuitFieldParams.depthOrder,
        },
        depthStagger: [circuitFieldParams.depthStagger, 0, 30, 0.25],
        sweepDuration: [circuitFieldParams.sweepDuration, 1, 20, 0.25],
        sweepGap: [circuitFieldParams.sweepGap, 0, 30, 0.25],
        edgePadding: [circuitFieldParams.edgePadding, 4, 8, 0.25],
        timingVariation: [circuitFieldParams.timingVariation, 0, 1, 0.01],
        wireFlow: [circuitFieldParams.wireFlow, 0, 1, 0.01],
        sweepSpeed: [circuitFieldParams.sweepSpeed, 0.1, 3, 0.01],
        band: [circuitFieldParams.band, 0.03, 0.6, 0.005],
        gapMult: [circuitFieldParams.gapMult, 0, 2, 0.01],
        floor: [circuitFieldParams.floor, 0, 0.3, 0.005],
        timeScale: [circuitFieldParams.timeScale, 0, 3, 0.01],
        breathe: [circuitFieldParams.breathe, 0, 0.25, 0.005],
      },
      color: {
        bandC0: circuitFieldParams.bandC0,
        bandC1: circuitFieldParams.bandC1,
        bandC2: circuitFieldParams.bandC2,
        bandMid: [circuitFieldParams.bandMid, 0, 1, 0.01],
        tintC: circuitFieldParams.tintC,
        tintAmt: [circuitFieldParams.tintAmt, 0, 1, 0.01],
        exposure: [circuitFieldParams.exposure, 0, 1.5, 0.01],
        atmosphere: [circuitFieldParams.atmosphere, 0, 1, 0.01],
      },
      scroll: {
        scrollBlur: [circuitFieldParams.scrollBlur, 0, 30, 0.5],
        scrollDimTo: [circuitFieldParams.scrollDimTo, 0, 1, 0.01],
      },
    },
  );
  const selectedPreset = values.choreography as CircuitFieldChoreographyPreset;
  const previousPreset = useRef(selectedPreset);

  useEffect(() => {
    if (selectedPreset !== previousPreset.current) {
      previousPreset.current = selectedPreset;
      applyChoreographyPreset(selectedPreset);
      return;
    }

    Object.assign(circuitFieldParams, {
      ...values.camera,
      ...values.focus,
      ...values.movement,
      ...values.color,
      ...values.scroll,
      ...values.quality,
      ...values.layers,
      count: Math.round(values.layers.count),
    });
    window.dispatchEvent(new Event(CIRCUIT_FIELD_TUNE_EVENT));
  }, [selectedPreset, values]);

  return null;
}

export default function CircuitFieldTune() {
  return (
    <>
      <CircuitFieldControls />
      <DialRoot position="top-right" productionEnabled />
    </>
  );
}
