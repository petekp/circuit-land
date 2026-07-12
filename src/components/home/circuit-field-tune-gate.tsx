"use client";

import dynamic from "next/dynamic";

const CircuitFieldTune = dynamic(() => import("./circuit-field-tune"), {
  ssr: false,
});

export default function CircuitFieldTuneGate() {
  const enabled =
    process.env.NODE_ENV === "development" ||
    new URLSearchParams(window.location.search).has("tune");

  return enabled ? <CircuitFieldTune /> : null;
}
