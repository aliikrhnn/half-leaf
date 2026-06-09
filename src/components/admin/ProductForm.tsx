"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, AlertCircle, Upload, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";

interface CategoryOption {
  id: string;
  name: string;
}

interface ImageInput {
  url: string;
  alt: string;
  sortOrder: number;
  uploading?: boolean;
}

interface SpecInput {
  key: string;
  value: string;
  sortOrder: number;
}

interface FormState {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  priceCurrency: "TRY" | "USD";
  stock: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  images: ImageInput[];
  tags: string[];
  specs: SpecInput[];
}

interface ExistingProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  priceCurrency?: "TRY" | "USD";
  stock: number;
  categoryId: string;
  isActive?: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew?: boolean;
  images: { url: string; alt: string; sortOrder?: number }[];
  tags: { tag: string }[] | string[];
  specs?: SpecInput[];
}

interface ProductFormProps {
  product?: ExistingProduct;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  priceCurrency: "TRY",
  stock: "0",
  categoryId: "",
  isActive: true,
  isFeatured: false,
  isBestseller: false,
  isNew: false,
  images: [],
  tags: [],
  specs: [],
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [usdTryRate, setUsdTryRate] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => {
      if (j.success) setCategories(j.data);
    });
    fetch("/api/admin/kur").then((r) => r.json()).then((j: { success: boolean; data?: { usdTryRate: number | null } }) => {
      if (j.success && j.data?.usdTryRate != null) setUsdTryRate(j.data.usdTryRate);
    }).catch(() => { /* ignore — rate preview is optional */ });
  }, []);

  useEffect(() => {
    if (product) {
      const rawTags = product.tags ?? [];
      const normalizedTags = rawTags.map((t) =>
        typeof t === "string" ? t : t.tag
      );

      const rawImages = product.images ?? [];
      const normalizedImages = rawImages.map((img, i) => ({
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder ?? i,
      }));

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.shortDescription ?? "",
        description: product.description ?? "",
        price: String(product.price),
        compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
        priceCurrency: product.priceCurrency ?? "TRY",
        stock: String(product.stock),
        categoryId: product.categoryId,
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured,
        isBestseller: product.isBestseller,
        isNew: product.isNew ?? false,
        images: normalizedImages,
        tags: normalizedTags,
        specs: product.specs ?? [],
      });
    }
  }, [product]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: product ? prev.slug : slugify(name),
    }));
  };

  const removeImage = (i: number) =>
    set("images", form.images.filter((_, idx) => idx !== i));

  const updateImage = (i: number, field: keyof ImageInput, value: string | number) =>
    set("images", form.images.map((img, idx) => idx === i ? { ...img, [field]: value } : img));

  const moveImage = (i: number, dir: -1 | 1) => {
    const next = i + dir;
    if (next < 0 || next >= form.images.length) return;
    const arr = [...form.images];
    [arr[i], arr[next]] = [arr[next], arr[i]];
    set("images", arr.map((img, idx) => ({ ...img, sortOrder: idx })));
  };

  const uploadFile = useCallback(async (file: File) => {
    setUploadError("");
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setUploadError("Yalnızca JPG, PNG, WEBP veya AVIF yüklenebilir.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Dosya boyutu en fazla 5 MB olabilir.");
      return;
    }

    const placeholder: ImageInput = { url: "", alt: file.name.replace(/\.[^.]+$/, ""), sortOrder: 0, uploading: true };
    setForm((prev) => {
      const next = [...prev.images, { ...placeholder, sortOrder: prev.images.length }];
      return { ...prev, images: next };
    });

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
      const json = await res.json() as { success: boolean; data?: { url: string }; error?: string };

      if (!json.success || !json.data) {
        // Remove the placeholder on failure
        setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== placeholder) }));
        setUploadError(json.error ?? "Yükleme başarısız oldu.");
        return;
      }

      setForm((prev) => {
        const idx = prev.images.findIndex((img) => img.uploading && img.alt === placeholder.alt && img.url === "");
        if (idx === -1) return prev;
        const updated = [...prev.images];
        updated[idx] = { ...updated[idx], url: json.data!.url, uploading: false };
        return { ...prev, images: updated };
      });
    } catch {
      setForm((prev) => ({ ...prev, images: prev.images.filter((img) => !img.uploading) }));
      setUploadError("Yükleme sırasında bir hata oluştu.");
    }
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => uploadFile(f));
  }, [uploadFile]);

  const addSpec = () =>
    set("specs", [...form.specs, { key: "", value: "", sortOrder: form.specs.length }]);

  const removeSpec = (i: number) =>
    set("specs", form.specs.filter((_, idx) => idx !== i));

  const updateSpec = (i: number, field: keyof SpecInput, value: string | number) =>
    set("specs", form.specs.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      set("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => set("tags", form.tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      basePrice: parseFloat(form.price),
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
      priceCurrency: form.priceCurrency,
      stock: parseInt(form.stock),
      categoryId: form.categoryId,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isBestseller: form.isBestseller,
      isNew: form.isNew,
      images: form.images
        .filter((img) => img.url && !img.uploading)
        .map((img, idx) => ({ url: img.url, altText: img.alt, sortOrder: idx })),
      tags: form.tags,
      specs: form.specs.filter((s) => s.key && s.value),
    };

    try {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Hata oluştu.");
      router.push("/admin/urunler");
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
    <form onSubmit={handleSubmit} className="p-6 max-w-3xl space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2">
          Temel Bilgiler
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-ink-muted mb-1">Ürün Adı *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClass}
              placeholder="Premium Cam Hazne"
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
              placeholder="premium-cam-hazne"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-muted mb-1">SKU *</label>
            <input
              type="text"
              required
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              className={inputClass}
              placeholder="HL-CAM-001"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-ink-muted mb-1">Kısa Açıklama</label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              className={inputClass}
              placeholder="Ürünün kısa özeti (kart görünümü için)"
              maxLength={500}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-ink-muted mb-1">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass + " h-28 resize-none"}
              placeholder="Detaylı ürün açıklaması"
            />
          </div>
        </div>
      </section>

      {/* Pricing & Stock */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2">
          Fiyat ve Stok
        </h2>

        {/* Currency selector */}
        <div>
          <label className="block text-xs text-ink-muted mb-2">Para Birimi</label>
          <div className="flex gap-3">
            {(["TRY", "USD"] as const).map(cur => (
              <label key={cur} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priceCurrency"
                  value={cur}
                  checked={form.priceCurrency === cur}
                  onChange={() => set("priceCurrency", cur)}
                  className="accent-accent"
                />
                <span className="text-sm text-ink">{cur === "TRY" ? "₺ TRY (Türk Lirası)" : "$ USD (Dolar)"}</span>
              </label>
            ))}
          </div>
          {form.priceCurrency === "USD" && (
            <p className="text-xs text-yellow-400 mt-1.5">
              USD seçildi — storefront&apos;ta fiyat otomatik olarak TRY&apos;ye çevrilir.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-ink-muted mb-1">
              Fiyat ({form.priceCurrency === "USD" ? "$" : "₺"}) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
            {form.priceCurrency === "USD" && usdTryRate != null && form.price && !isNaN(parseFloat(form.price)) && (
              <p className="text-xs text-ink-dim mt-1">
                ≈ ₺{(parseFloat(form.price) * usdTryRate).toFixed(2)} (güncel kur: {usdTryRate.toFixed(4)})
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">
              Karşılaştırma Fiyatı ({form.priceCurrency === "USD" ? "$" : "₺"})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
            {form.priceCurrency === "USD" && usdTryRate != null && form.compareAtPrice && !isNaN(parseFloat(form.compareAtPrice)) && (
              <p className="text-xs text-ink-dim mt-1">
                ≈ ₺{(parseFloat(form.compareAtPrice) * usdTryRate).toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">Stok *</label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Category & Status */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2">
          Kategori ve Durum
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-muted mb-1">Kategori *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputClass}
            >
              <option value="">Kategori Seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-end pb-1">
            {([
              ["isActive", "Aktif"],
              ["isFeatured", "Öne Çıkan"],
              ["isBestseller", "Çok Satan"],
              ["isNew", "Yeni Ürün"],
            ] as [keyof FormState, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-sm text-ink">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2">
          Görseller
        </h2>

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            <AlertCircle size={13} />
            {uploadError}
          </div>
        )}

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Görsel yükle"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors outline-none ${
            dragging
              ? "border-accent bg-accent/5"
              : "border-border-default hover:border-ink-dim"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload size={20} className={dragging ? "text-accent-light" : "text-ink-dim"} />
            <span className="text-xs text-ink-muted leading-relaxed">
              Görselleri sürükleyip bırakın veya tıklayıp seçin.<br />
              Birden fazla dosya seçebilirsiniz.
            </span>
            <span className="text-[10px] text-ink-dim">JPG, PNG, WEBP, AVIF · maks. 5 MB</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {/* Image cards */}
        {form.images.length > 0 && (
          <div className="space-y-2">
            {form.images.map((img, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-bg-elevated border border-border-default rounded-lg"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-bg-surface border border-border-default">
                  {img.uploading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-ink-dim" />
                    </div>
                  ) : img.url ? (
                    <Image src={img.url} alt={img.alt || "Görsel"} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-dim">
                      <Plus size={16} />
                    </div>
                  )}
                </div>

                {/* Alt text */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] text-ink-dim mb-1">Alt metin (SEO)</label>
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => updateImage(i, "alt", e.target.value)}
                    disabled={img.uploading}
                    className={inputClass + " text-xs"}
                    placeholder="Ürün görsel açıklaması"
                  />
                  {img.uploading && (
                    <span className="text-[10px] text-ink-dim mt-0.5 inline-block">Yükleniyor...</span>
                  )}
                </div>

                {/* Order + remove */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0 || img.uploading}
                    className="p-1 text-ink-dim hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Yukarı taşı"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === form.images.length - 1 || img.uploading}
                    className="p-1 text-ink-dim hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Aşağı taşı"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={img.uploading}
                  className="p-1.5 text-ink-dim hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Kaldır"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tags */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2">
          Etiketler
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            className={inputClass + " flex-1"}
            placeholder="Etiket yazın ve Enter'a basın"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addTag}>
            Ekle
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-elevated border border-border-default rounded-full text-xs text-ink"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-ink-dim hover:text-red-400 transition-colors">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Specs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-default pb-2">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">Özellikler</h2>
          <button type="button" onClick={addSpec} className="flex items-center gap-1 text-xs text-accent-light hover:text-gold transition-colors">
            <Plus size={13} /> Özellik Ekle
          </button>
        </div>
        <div className="space-y-2">
          {form.specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={spec.key}
                onChange={(e) => updateSpec(i, "key", e.target.value)}
                className={inputClass + " flex-1"}
                placeholder="Malzeme"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
                className={inputClass + " flex-1"}
                placeholder="Borosilikat Cam"
              />
              <button
                type="button"
                onClick={() => removeSpec(i)}
                className="p-2 text-ink-dim hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {form.specs.length === 0 && (
            <p className="text-xs text-ink-dim italic">Henüz özellik eklenmedi.</p>
          )}
        </div>
      </section>

      {/* Submit */}
      <div className="flex gap-3 pt-2 border-t border-border-default">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Kaydediliyor..." : product ? "Güncelle" : "Ürün Oluştur"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          İptal
        </Button>
      </div>
    </form>
  );
}
