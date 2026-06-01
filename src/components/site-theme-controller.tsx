"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

export const DEFAULT_PRIMARY_HUE = 150;
export const DEFAULT_GAMUT_SWEEP = 215;
export const SITE_THEME_PARAMS_EVENT = "site-theme-params";

export type SiteThemeParams = {
  primaryHue: number;
  gamutSweep: number;
};

type HueStop = {
  scrollY: number;
  offset: number;
};

const HUE_STOP_SELECTOR = "[data-site-hue-stop]";
const THEME_COLOR_SELECTOR = 'meta[name="theme-color"]';

function getSiteBackground(hue: number) {
  return `hsl(${hue} 15% 9%)`;
}

function getFallbackStops(): HueStop[] {
  return [
    { scrollY: 0, offset: 0 },
    { scrollY: 1, offset: 0 },
  ];
}

function getValidParams(params: Partial<SiteThemeParams> = {}): SiteThemeParams {
  return {
    primaryHue: Number.isFinite(params.primaryHue)
      ? Number(params.primaryHue)
      : DEFAULT_PRIMARY_HUE,
    gamutSweep: Number.isFinite(params.gamutSweep)
      ? Number(params.gamutSweep)
      : DEFAULT_GAMUT_SWEEP,
  };
}

export function SiteThemeController() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [hueStops, setHueStops] = useState<HueStop[]>(getFallbackStops);
  const [params, setParams] = useState<SiteThemeParams>({
    primaryHue: DEFAULT_PRIMARY_HUE,
    gamutSweep: DEFAULT_GAMUT_SWEEP,
  });

  const inputRange = useMemo(
    () => hueStops.map((stop) => stop.scrollY),
    [hueStops],
  );

  const outputRange = useMemo(
    () =>
      hueStops.map((stop) =>
        params.primaryHue + stop.offset * params.gamutSweep,
      ),
    [hueStops, params.primaryHue, params.gamutSweep],
  );

  const interpolatedHue = useTransform(scrollY, inputRange, outputRange, {
    clamp: true,
  });
  const smoothHue = useSpring(interpolatedHue, {
    stiffness: 520,
    damping: 52,
    mass: 0.18,
  });

  const applyThemeHue = useCallback((hue: number) => {
    const themeColor = document.querySelector<HTMLMetaElement>(
      THEME_COLOR_SELECTOR,
    );

    document.documentElement.style.setProperty(
      "--site-primary-hue",
      String(hue),
    );

    themeColor?.setAttribute("content", getSiteBackground(hue));
  }, []);

  useEffect(() => {
    const measureStops = () => {
      const maxScrollY = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const measuredStops = Array.from(
        document.querySelectorAll<HTMLElement>(HUE_STOP_SELECTOR),
        (element) => {
          const rect = element.getBoundingClientRect();
          const absoluteTop = window.scrollY + rect.top;
          const sectionAnchor =
            absoluteTop + rect.height * 0.22 - window.innerHeight * 0.32;

          return {
            scrollY: Math.min(Math.max(sectionAnchor, 0), maxScrollY),
            offset: Number(element.dataset.siteHueStop ?? 0),
          };
        },
      )
        .filter((stop) => Number.isFinite(stop.offset))
        .sort((a, b) => a.scrollY - b.scrollY)
        .filter(
          (stop, index, stops) =>
            index === 0 || stop.scrollY > stops[index - 1].scrollY + 1,
        );

      setHueStops(
        measuredStops.length > 1 ? measuredStops : getFallbackStops(),
      );
    };

    measureStops();

    window.addEventListener("resize", measureStops);
    window.addEventListener("load", measureStops);

    const observer = new ResizeObserver(measureStops);
    document
      .querySelectorAll<HTMLElement>(HUE_STOP_SELECTOR)
      .forEach((element) => observer.observe(element));

    return () => {
      window.removeEventListener("resize", measureStops);
      window.removeEventListener("load", measureStops);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleThemeParams = (event: Event) => {
      setParams(
        getValidParams((event as CustomEvent<Partial<SiteThemeParams>>).detail),
      );
    };

    window.addEventListener(SITE_THEME_PARAMS_EVENT, handleThemeParams);

    return () => {
      window.removeEventListener(SITE_THEME_PARAMS_EVENT, handleThemeParams);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      applyThemeHue(params.primaryHue);
      return;
    }

    applyThemeHue(smoothHue.get());
  }, [
    applyThemeHue,
    params.primaryHue,
    params.gamutSweep,
    prefersReducedMotion,
    smoothHue,
  ]);

  useMotionValueEvent(smoothHue, "change", (hue) => {
    if (!prefersReducedMotion) {
      applyThemeHue(hue);
    }
  });

  return null;
}
