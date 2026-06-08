"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ returnId }: { returnId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleCancel = async () => {
    if (!confirm("İade talebinizi iptal etmek istediğinizden emin misiniz?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/iade-talepleri/${returnId}`, { method: "PATCH" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "İşlem başarısız."); return; }
      router.push("/hesabim/iade-taleplerim");
      router.refresh();
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <p style={{ fontSize: 12, color: "#e05252", marginBottom: 8 }}>{error}</p>
      )}
      <button
        onClick={handleCancel}
        disabled={loading}
        style={{
          padding: "10px 20px", borderRadius: 8, border: "1px solid #e05252",
          background: "transparent", color: "#e05252",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "İptal ediliyor…" : "Talebi İptal Et"}
      </button>
    </div>
  );
}
