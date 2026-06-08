"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Wand2, RotateCcw, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ProductImageData {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  originalUrl: string | null;
  processedUrl: string | null;
  isProcessed: boolean;
  processedAt: string | null;
  processingError: string | null;
}

interface Props {
  productId: string;
}

export default function ImageProcessingPanel({ productId }: Props) {
  const [images, setImages] = useState<ProductImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/image-processing/images?productId=${productId}`
      );
      const json = await res.json();
      if (json.success) setImages(json.data.images);
    } catch {
      setError("Görsel bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching on mount, useCallback stabilizes ref
    fetchImages();
  }, [fetchImages]);

  const handleConvert = async (imageId: string) => {
    setProcessingId(imageId);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/image-processing/single/${imageId}`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Dönüştürme hatası.");
      await fetchImages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dönüştürme sırasında hata.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevert = async (imageId: string) => {
    setProcessingId(imageId);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/image-processing/revert/${imageId}`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Geri alma hatası.");
      await fetchImages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Geri alma sırasında hata.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteProcessed = async (imageId: string) => {
    if (!confirm("İşlenmiş sürüm silinecek. Emin misiniz?")) return;
    setProcessingId(imageId);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/image-processing/processed/${imageId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Silme hatası.");
      await fetchImages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Silme sırasında hata.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-24 bg-bg-elevated rounded-xl animate-pulse" />
    );
  }

  if (images.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2">
        AI Görsel Dönüştürme
      </h2>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {images.map((img) => {
          const isBusy = processingId === img.id;
          return (
            <div
              key={img.id}
              className="flex items-center gap-3 p-3 bg-bg-elevated border border-border-default rounded-lg"
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-bg-surface">
                <Image
                  src={img.url}
                  alt={img.altText}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink truncate">
                  {img.altText || `Görsel ${img.sortOrder + 1}`}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {img.isProcessed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle size={11} />
                      Profesyonel
                    </span>
                  ) : (
                    <span className="text-xs text-ink-dim">Orijinal</span>
                  )}
                  {img.processingError && (
                    <span
                      className="text-xs text-red-400 cursor-help"
                      title={img.processingError}
                    >
                      <AlertCircle size={11} />
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!img.isProcessed && img.originalUrl && (
                  <button
                    onClick={() => handleConvert(img.id)}
                    disabled={isBusy || processingId !== null}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-accent/10 text-accent-light border border-accent/30 rounded-md hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    {isBusy ? "İşleniyor..." : "AI ile Dönüştür"}
                  </button>
                )}

                {img.isProcessed && (
                  <button
                    onClick={() => handleRevert(img.id)}
                    disabled={isBusy || processingId !== null}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-ink-muted border border-border-default rounded-md hover:border-ink-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    Orijinale Dön
                  </button>
                )}

                {img.processedUrl && (
                  <button
                    onClick={() => handleDeleteProcessed(img.id)}
                    disabled={isBusy || processingId !== null}
                    className="p-1.5 text-ink-dim hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="İşlenmiş sürümü sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
