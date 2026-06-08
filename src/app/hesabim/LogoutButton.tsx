"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: 8,
        border: "1px solid var(--hl-line-strong)",
        background: "transparent", cursor: loading ? "not-allowed" : "pointer",
        color: loading ? "var(--hl-text-mute)" : "var(--hl-text-soft)",
        fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 600,
        letterSpacing: "0.05em", transition: "all 150ms ease",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <LogOut size={14} />
      {loading ? "Çıkış yapılıyor…" : "Çıkış Yap"}
    </button>
  );
}
