"use client";

import { useLayoutEffect } from "react";

type ScrollToTopProps = {
  behavior?: ScrollBehavior;
};

export function ScrollToTop({ behavior = "auto" }: ScrollToTopProps) {
  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior });
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [behavior]);

  return null;
}
