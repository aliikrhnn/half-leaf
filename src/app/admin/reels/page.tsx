"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, AlertCircle, Check, GripVertical, Film, Eye, EyeOff } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import VideoUploadField from "@/components/admin/VideoUploadField";

interface ReelProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  isActive: boolean;
  ProductImage: { url: string }[];
}

interface Reel {
  id: string;
  productId: string;
  videoUrl: string | null;
  badge: string | null;
  handle: string | null;
  sortOrder: number;
  isActive: boolean;
  Product: ReelProduct;
}

interface PickerProduct {
  id: string;
  name: string;
  brand?: string;
}

const DEFAULT_HANDLE = "@halfleafstore";

export default function AdminReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  // Yeni reel formu
  const [adding, setAdding] = useState(false);
  const [products, setProducts] = useState<PickerProduct[]>([]);
  const [newProductId, setNewProductId] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newVideo, setNewVideo] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reels");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setReels(json.data);
    } catch {
      setError("Reel'ler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- veri çekme deseni
  useEffect(() => { void load(); }, [load]);

  // Ürün seçici listesi (form açılınca bir kez)
  useEffect(() => {
    if (!adding || products.length > 0) return;
    void (async () => {
      try {
        const res = await fetch("/api/products?limit=200");
        const json = await res.json();
        if (json.success) setProducts(json.data);
      } catch { /* seçici boş kalır */ }
    })();
  }, [adding, products.length]);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2500);
  };

  const create = async () => {
    if (!newProductId) { setError("Önce bir ürün seçin."); return; }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: newProductId,
          videoUrl: newVideo || null,
          badge: newBadge || null,
          handle: DEFAULT_HANDLE,
          sortOrder: reels.length * 10,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setNewProductId(""); setNewBadge(""); setNewVideo(""); setAdding(false);
      await load();
      flash("Reel eklendi");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reel eklenemedi.");
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: string, data: Record<string, unknown>, msg: string) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/reels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await load();
      flash(msg);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Güncellenemedi.");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu reel silinecek. Video dosyası depoda kalır. Onaylıyor musunuz?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/reels/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await load();
      flash("Reel silindi");
    } catch {
      setError("Reel silinemedi.");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= reels.length) return;
    const a = reels[index], b = reels[target];
    await Promise.all([
      fetch(`/api/admin/reels/${a.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/admin/reels/${b.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    await load();
  };

  const usedIds = new Set(reels.map((r) => r.productId));

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Reels"
        subtitle={`${reels.length} video · ana sayfa karuseli`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus size={16} />
            {adding ? "Vazgeç" : "Yeni Reel"}
          </Button>
        }
      />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">
        <p className="text-xs text-ink-dim leading-relaxed max-w-2xl">
          Ana sayfadaki <b className="text-ink-muted">&quot;Hangi model sana göre?&quot;</b> karuseli
          buradan yönetilir. Marka, model adı ve fiyat ürünün kendisinden gelir — burada yalnızca
          videoyu, rozeti ve sırayı belirlersiniz. Videosu olmayan kart, video yüklenene kadar
          ürün adını gösteren bir yer tutucu ile görünür.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
            <Check size={16} /> {saved}
          </div>
        )}

        {/* Yeni reel formu */}
        {adding && (
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4 max-w-2xl">
            <h2 className="text-sm font-semibold text-ink">Yeni Reel</h2>

            <div>
              <label className="block text-xs text-ink-dim mb-1.5">Ürün</label>
              <select
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">— Ürün seçin —</option>
                {products
                  .filter((p) => !usedIds.has(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand ? `${p.brand} · ` : ""}{p.name}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-ink-dim mt-1.5">
                Zaten reel&apos;i olan ürünler listede görünmez (ürün başına tek reel).
              </p>
            </div>

            <div>
              <label className="block text-xs text-ink-dim mb-1.5">Rozet (opsiyonel)</label>
              <input
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                placeholder="Çok Satan · %10 İndirim · Stok Az"
                className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent placeholder:text-ink-dim"
              />
            </div>

            <VideoUploadField label="Video (sonradan da yükleyebilirsiniz)" value={newVideo} onChange={setNewVideo} />

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Vazgeç</Button>
              <Button variant="primary" size="sm" onClick={create} disabled={creating || !newProductId}>
                {creating ? "Ekleniyor…" : "Ekle"}
              </Button>
            </div>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-bg-elevated rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Film size={30} className="text-ink-dim" />
            <p className="text-ink-muted text-sm">Henüz reel eklenmedi.</p>
            <p className="text-ink-dim text-xs">Ana sayfada karusel bölümü hiç görünmez.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reels.map((r, i) => (
              <div
                key={r.id}
                className="bg-bg-surface border border-border-default rounded-xl p-4 flex flex-col lg:flex-row gap-4"
              >
                {/* Sıra */}
                <div className="flex lg:flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 text-ink-dim hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed"
                    aria-label="Yukarı taşı"
                  >▲</button>
                  <GripVertical size={14} className="text-ink-dim" />
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === reels.length - 1}
                    className="p-1.5 text-ink-dim hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed"
                    aria-label="Aşağı taşı"
                  >▼</button>
                </div>

                {/* Ürün görseli */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-bg-elevated flex-shrink-0">
                  {r.Product.ProductImage[0] ? (
                    <Image src={r.Product.ProductImage[0].url} alt={r.Product.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-accent font-bold">
                      {r.Product.name[0]}
                    </div>
                  )}
                </div>

                {/* Bilgi + ayarlar */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink">{r.Product.name}</span>
                    {r.Product.brand && <span className="text-xs text-ink-dim">{r.Product.brand}</span>}
                    {r.isActive ? <Badge variant="success">Yayında</Badge> : <Badge variant="default">Gizli</Badge>}
                    {!r.Product.isActive && <Badge variant="default">Ürün pasif</Badge>}
                    {!r.videoUrl && <Badge variant="default">Video yok</Badge>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-ink-dim mb-1">Rozet</label>
                      <input
                        defaultValue={r.badge ?? ""}
                        onBlur={(e) => {
                          if (e.target.value !== (r.badge ?? "")) {
                            void patch(r.id, { badge: e.target.value }, "Rozet güncellendi");
                          }
                        }}
                        placeholder="—"
                        className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-ink-dim"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => void patch(r.id, { isActive: !r.isActive }, r.isActive ? "Gizlendi" : "Yayınlandı")}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink border border-border-default rounded-lg hover:bg-bg-elevated transition-colors"
                      >
                        {r.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        {r.isActive ? "Gizle" : "Yayınla"}
                      </button>
                      <button
                        onClick={() => void remove(r.id)}
                        className="p-2 text-ink-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <VideoUploadField
                    label="Video"
                    value={r.videoUrl ?? ""}
                    onChange={(url) => void patch(r.id, { videoUrl: url }, url ? "Video yüklendi" : "Video kaldırıldı")}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
