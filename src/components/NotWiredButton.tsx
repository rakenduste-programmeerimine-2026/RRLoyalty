"use client";

import { useEffect, useState, type ReactNode } from "react";

type NotWiredButtonProps = {
  className?: string;
  /**
   * What the toast says. Leave it out for a feature that isn't built yet. Pass it for a
   * simulated action that is meant to stay fake in the prototype (docs/program-rules.md).
   */
  message?: string;
  children: ReactNode;
};

/** A button that only shows a short message: a feature not built yet, or one the prototype simulates. */
export function NotWiredButton({ className = "btn", message = "Seda veel pole", children }: NotWiredButtonProps) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!showNotice) return;
    const timer = setTimeout(() => setShowNotice(false), 2000);
    return () => clearTimeout(timer);
  }, [showNotice]);

  return (
    <>
      <button type="button" className={className} onClick={() => setShowNotice(true)}>
        {children}
      </button>
      {showNotice && <div className="toast" role="status">{message}</div>}
    </>
  );
}
