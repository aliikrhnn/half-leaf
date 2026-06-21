"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface ExistingCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryFormProps {
  category?: ExistingCategory;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    imageUrl: category?.imageUrl ?? "",
    parentId: category?.parentId ?? "",
    isActive: category?.isActive ?? true,
    sortOrder: String(category?.sortOrder ?? 0),
  });
  const [parentOptions, setParentOptions] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Üst kategori seçimi için mevcut kategoriler.
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => { if (j.success && Array.isArray(j.data)) setParentOptions(j.data); })
      .catch(() => { /* opsiyonel */ });
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleNameChange = (name: string) =>
    setForm((prev) => ({
      ...prev,
      name,
      slug: category ? prev.slug : slugify(name),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      parentId: form.parentId || null,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder),
    };

    try {
      const url = category ? `/api/categories/${category.id}` : "/api/categories";
      const method = category ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Hata oluştu.");
      router.push("/admin/kategoriler");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-lg space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs text-ink-muted mb-1">Kategori Adı *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={inputClass}
          placeholder="Cam Hazneler"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-1">Slug *</label>
        <input
          type="text"
          required
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
          className={inputClass}
          placeholder="cam-hazneler"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-1">Açıklama</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass + " h-24 resize-none"}
          placeholder="Kategori açıklaması"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-1">Üst Kategori</label>
        <select
          value={form.parentId}
          onChange={(e) => set("parentId", e.target.value)}
          className={inputClass}
        >
          <option value="">Ana kategori (üst kategori yok)</option>
          {parentOptions
            .filter((c) => c.id !== category?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
        <p className="text-[11px] text-ink-dim mt-1">
          Bu kategoriyi başka bir kategorinin alt kategorisi yapmak için seçin. Boş bırakırsanız ana kategori olur.
        </p>
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-1">Görsel URL</label>
        <input
          type="url"
          value={form.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          className={inputClass}
          placeholder="https://placehold.co/400x400/1a1a1a/4a7c59?text=Kategori"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-muted mb-1">Sıra</label>
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm text-ink">Aktif</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-3 border-t border-border-default">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Kaydediliyor..." : category ? "Güncelle" : "Oluştur"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          İptal
        </Button>
      </div>
    </form>
  );
}
