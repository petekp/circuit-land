"use client";

import { useEffect } from "react";
import { DialRoot, useDialKit } from "dialkit";
import {
  DEFAULT_GAMUT_SWEEP,
  DEFAULT_PRIMARY_HUE,
  SITE_THEME_PARAMS_EVENT,
  type SiteThemeParams,
} from "@/components/site-theme-controller";

export function SiteThemeDials() {
  const params = useDialKit("Site color", {
    primaryHue: [DEFAULT_PRIMARY_HUE, 0, 360, 1],
    gamutSweep: [DEFAULT_GAMUT_SWEEP, 0, 720, 1],
  });

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<SiteThemeParams>(SITE_THEME_PARAMS_EVENT, {
        detail: {
          primaryHue: params.primaryHue,
          gamutSweep: params.gamutSweep,
        },
      }),
    );
  }, [params.primaryHue, params.gamutSweep]);

  return <DialRoot position="top-right" defaultOpen={false} theme="dark" />;
}
