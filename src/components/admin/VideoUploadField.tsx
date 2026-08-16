"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, AlertCircle, Loader2, Film } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

interface UploadResponse {
  success?: boolean;
  data?: { url: string };
  error?: string;
}

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
/** Sunucudaki sert sınırla aynı olmalı (api/admin/reels/upload). */
const MAX_MB = 20;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function VideoUploadField({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = useCallback(async (file: File) => {
    setError("");
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Yalnızca MP4, WEBM veya MOV yüklenebilir.");
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setError(`Video en fazla ${MAX_MB} MB olabilir. Seçilen dosya ${mb} MB.`);
      return;
    }
    setUploading(true);
    try {
      // FormData DEĞİL: route handler'ın multipart ayrıştırıcısı 10 MB'da
      // kırılıyor. Dosyayı ham gövde olarak gönderiyoruz (bkz. upload/route.ts).
      const res = await fetch("/api/admin/reels/upload", {
        method: "POST",
        headers: {
          "content-type": file.type,
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
      });

      // Yanıt her zaman JSON olmayabilir (ör. platform 413/502 ile HTML döner).
      // Body'yi ham okuyup ayrıştırıyoruz ki hata "bir şeyler ters gitti"ye düşmesin.
      const raw = await res.text();
      let json: UploadResponse | null = null;
      try { json = JSON.parse(raw) as UploadResponse; } catch { /* JSON değil */ }

      if (!json) {
        setError(`Sunucu beklenmeyen bir yanıt döndürdü (HTTP ${res.status}).`);
        return;
      }
      if (!json.success || !json.data) {
        setError(json.error ?? `Yükleme başarısız oldu (HTTP ${res.status}).`);
        return;
      }
      onChange(json.data.url);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "bilinmeyen hata";
      setError(`Yükleme tamamlanamadı: ${reason}`);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  return (
    <div>
      <label className="block text-xs text-ink-dim mb-1.5">{label}</label>

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border-default bg-bg-elevated">
          <video
            src={value}
            className="w-full max-h-64 object-contain bg-black"
            controls
            muted
            playsInline
            preload="metadata"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-2 rounded-lg bg-bg/80 text-ink-muted hover:text-red-400 transition-colors"
            aria-label="Videoyu kaldır"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void upload(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-lg border border-dashed cursor-pointer transition-colors ${
            dragging ? "border-accent bg-bg-elevated" : "border-border-default hover:border-border-light"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="text-accent animate-spin" />
              <span className="text-xs text-ink-muted">Yükleniyor…</span>
            </>
          ) : (
            <>
              <Film size={22} className="text-ink-dim" />
              <span className="text-sm text-ink">Videoyu sürükleyin veya seçin</span>
              <span className="text-[11px] text-ink-dim text-center leading-relaxed">
                Dikey 9:16 · ~720×1280 · 10-20 sn · MP4 · en fazla {MAX_MB} MB
              </span>
              <span className="inline-flex items-center gap-1.5 mt-1 text-xs text-accent">
                <Upload size={13} /> Dosya seç
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
}
