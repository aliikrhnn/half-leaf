"use client";

import { useState, useEffect } from "react";

const AGE_GATE_KEY = "half-leaf-age-verified";

export function useAgeGate() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AGE_GATE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage not available during SSR, must read in effect
    setIsVerified(stored === "true");
  }, []);

  const verify = () => {
    localStorage.setItem(AGE_GATE_KEY, "true");
    setIsVerified(true);
  };

  const reject = () => {
    window.location.replace("about:blank");
  };

  return { isVerified, verify, reject };
}
