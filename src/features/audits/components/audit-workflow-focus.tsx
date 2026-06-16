"use client";

import { useEffect } from "react";

type AuditWorkflowFocusProps = {
  sectionId: string;
};

export function AuditWorkflowFocus({ sectionId }: AuditWorkflowFocusProps) {
  useEffect(() => {
    const currentHash = window.location.hash.replace("#", "");
    const targetId =
      currentHash && document.getElementById(currentHash) ? currentHash : sectionId;
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    if (!currentHash || currentHash !== targetId) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${targetId}`,
      );
    }

    target.scrollIntoView({ block: "start" });
  }, [sectionId]);

  return null;
}
