"use client";

import { useState, useEffect } from "react";

const AGE_GATE_KEY = "half-leaf-age-verified";
const AGE_COOKIE = "hl-age";

function hasAgeCookie(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${AGE_COOKIE}=1`));
}

export function useAgeGate() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Çerez sunucuya da gider ve ConsentLog kaydıyla eşleşir; localStorage
    // yalnızca çerez silinmiş/engellenmiş tarayıcılar için yedek.
    const verified = hasAgeCookie() || localStorage.getItem(AGE_GATE_KEY) === "true";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı depoları SSR'de okunamaz
    setIsVerified(verified);
  }, []);

  const verify = () => {
    try {
      localStorage.setItem(AGE_GATE_KEY, "true");
    } catch {
      /* gizli sekme — çerez yine de yazılır */
    }
    setIsVerified(true);

    // Beyanı sunucuda kayıt altına al (IP + zaman damgası) ve çerezi yaz.
    // Başarısız olursa kullanıcı yine de siteye girer.
    void fetch("/api/yas-dogrulama", { method: "POST", credentials: "include" }).catch(() => {});
  };

  const reject = () => {
    window.location.replace("about:blank");
  };

  return { isVerified, verify, reject };
}
