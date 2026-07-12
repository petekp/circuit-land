"use client";

import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { useEffect } from "react";

import {
  CIRCUIT_FIELD_TUNE_EVENT,
  circuitFieldParams,
} from "./circuit-field-params";

function CircuitFieldControls() {
  const values = useDialKit(
    "Circuit field",
    {
      quality: {
        resolution: [circuitFieldParams.resolution, 0.75, 3, 0.25],
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
        stroke: [circuitFieldParams.stroke, 0.5, 6, 0.1],
        curviness: [circuitFieldParams.curviness, 0, 1, 0.01],
        taper: [circuitFieldParams.taper, 0.02, 0.75, 0.01],
        elbow: [circuitFieldParams.elbow, 0, 1, 0.01],
        elbowMid: [circuitFieldParams.elbowMid, 0.1, 0.9, 0.01],
        elbowRound: [circuitFieldParams.elbowRound, 0, 100, 1],
        lifetime: [circuitFieldParams.lifetime, 4, 40, 0.5],
      },
      movement: {
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

  useEffect(() => {
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
  }, [values]);

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
