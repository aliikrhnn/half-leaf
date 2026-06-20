"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Star, BadgeCheck, Check, X, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Badge from "@/components/ui/Badge";

type Status = "pending" | "approved" | "all";

interface ReviewRow {
  id: string;
  productSlug: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
}

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "all", label: "Tümü" },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className="text-gold" fill={n <= value ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export default function AdminYorumlarPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (s: Status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/yorumlar?status=${s}`);
      const json = await res.json() as { success: boolean; data?: ReviewRow[] };
      setRows(json.success && json.data ? json.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- veri çekme: status değişince yeniden yükle
  useEffect(() => { load(status); }, [status, load]);

  async function act(id: string, action: "approve" | "reject" | "delete") {
    if (action === "delete" && !window.confirm("Bu yorum kalıcı olarak silinecek. Onaylıyor musunuz?")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/yorumlar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json() as { success: boolean };
      if (json.success) await load(status);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Yorumlar" />
      <div className="p-3 sm:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === t.key ? "bg-accent text-ink" : "bg-bg-elevated text-ink-muted hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-bg-elevated rounded-xl animate-pulse" />)}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-dim py-8 text-center">Bu kategoride yorum yok.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="bg-bg-card border border-border-default rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Stars value={r.rating} />
                      <span className="text-sm font-semibold text-ink">{r.authorName}</span>
                      {r.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <BadgeCheck size={12} /> Doğrulanmış
                        </span>
                      )}
                      <Badge variant={r.isApproved ? "success" : "muted"}>{r.isApproved ? "Onaylı" : "Bekliyor"}</Badge>
                    </div>
                    <Link href={`/urunler/${r.productSlug}`} target="_blank" className="text-xs text-accent hover:underline">
                      {r.productName}
                    </Link>
                    {r.title && <p className="text-sm font-medium text-ink mt-2">{r.title}</p>}
                    <p className="text-sm text-ink-muted leading-relaxed mt-1 whitespace-pre-wrap">{r.body}</p>
                    <p className="text-[11px] text-ink-dim mt-2">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!r.isApproved && (
                      <button onClick={() => act(r.id, "approve")} disabled={busyId === r.id} title="Onayla"
                        className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-900 hover:bg-emerald-900/60 disabled:opacity-50">
                        <Check size={16} />
                      </button>
                    )}
                    {r.isApproved && (
                      <button onClick={() => act(r.id, "reject")} disabled={busyId === r.id} title="Yayından kaldır"
                        className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg bg-bg-elevated text-ink-muted border border-border-default hover:text-ink disabled:opacity-50">
                        <X size={16} />
                      </button>
                    )}
                    <button onClick={() => act(r.id, "delete")} disabled={busyId === r.id} title="Sil"
                      className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg bg-red-900/40 text-red-300 border border-red-900 hover:bg-red-900/60 disabled:opacity-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
