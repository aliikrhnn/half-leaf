"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, AlertCircle, Loader2, Film } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
/** lib/upload/reel-video.ts içindeki sınırla aynı olmalı. */
const MAX_MB = 20;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

/** Yanıt JSON olmayabilir (ör. 413 düz metin döner); hatayı yutmadan çöz. */
async function readEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const raw = await res.text();
  try {
    return JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    return { success: false, error: `Sunucu beklenmeyen bir yanıt döndürdü (HTTP ${res.status}).` };
  }
}

/**
 * Dosyayı imzalı adrese yükler. fetch yerine XHR: 20 MB'lık bir video mobil
 * bağlantıda uzun sürebiliyor ve fetch yükleme ilerlemesi bildirmiyor.
 */
function putWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`depolama HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("ağ hatası"));
    xhr.onabort = () => reject(new Error("yükleme iptal edildi"));
    xhr.send(file);
  });
}

export default function VideoUploadField({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    try {
      /* 1 — imzalı adres al (dosya bu istekte GİTMEZ) */
      const signRes = await fetch("/api/admin/reels/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const sign = await readEnvelope<{ signedUrl: string; path: string }>(signRes);
      if (!sign.success || !sign.data) {
        setError(sign.error ?? "Yükleme adresi alınamadı.");
        return;
      }

      /* 2 — dosyayı doğrudan Supabase'e yükle (Vercel'e uğramaz) */
      await putWithProgress(sign.data.signedUrl, file, setProgress);

      /* 3 — sunucuda boyut + video imzası doğrulaması */
      const verifyRes = await fetch("/api/admin/reels/upload-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: sign.data.path }),
      });
      const verify = await readEnvelope<{ url: string }>(verifyRes);
      if (!verify.success || !verify.data) {
        setError(verify.error ?? "Yüklenen dosya doğrulanamadı.");
        return;
      }

      onChange(verify.data.url);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "bilinmeyen hata";
      setError(`Yükleme tamamlanamadı: ${reason}`);
    } finally {
      setUploading(false);
      setProgress(0);
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
          onClick={() => { if (!uploading) inputRef.current?.click(); }}
          className={`flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-lg border border-dashed transition-colors ${
            uploading ? "cursor-wait" : "cursor-pointer"
          } ${dragging ? "border-accent bg-bg-elevated" : "border-border-default hover:border-border-light"}`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="text-accent animate-spin" />
              <span className="text-xs text-ink-muted">
                {progress > 0 && progress < 100 ? `Yükleniyor… %${progress}` : "İşleniyor…"}
              </span>
              <div className="w-40 h-1 rounded-full bg-border-default overflow-hidden" role="progressbar"
                   aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
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
