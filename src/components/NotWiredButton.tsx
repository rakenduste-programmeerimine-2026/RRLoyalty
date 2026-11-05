"use client";

import { useEffect, useState, type ReactNode } from "react";

/** A button whose feature isn't built yet. Replace it as each flow gets wired up. */
export function NotWiredButton({ className = "btn", children }: { className?: string; children: ReactNode }) {
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
      {showNotice && <div className="toast" role="status">Seda veel pole</div>}
    </>
  );
}
