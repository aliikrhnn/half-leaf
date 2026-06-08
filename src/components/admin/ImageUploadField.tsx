"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  label:    string;
  value:    string;
  onChange: (url: string) => void;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUploadField({ label, value, onChange }: Props) {
  const inputRef               = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");

  const upload = useCallback(async (file: File) => {
    setError("");
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Yalnızca JPG, PNG, WEBP veya AVIF yüklenebilir.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Dosya boyutu en fazla 5 MB olabilir.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/hero-slides/upload", { method: "POST", body: fd });
      const json = await res.json() as { success: boolean; data?: { url: string }; error?: string };
      if (!json.success || !json.data) {
        setError(json.error ?? "Yükleme başarısız oldu.");
        return;
      }
      onChange(json.data.url);
    } catch {
      setError("Yükleme sırasında bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }, [upload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleRemove = () => {
    onChange("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
        {label}
      </label>

      {value ? (
        /* ── Preview state ── */
        <div style={{ display: "inline-block", position: "relative" }}>
          <div
            style={{
              position: "relative",
              width: 200,
              height: 160,
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid var(--border-default, rgba(255,255,255,0.08))",
              background: "var(--bg-surface, #111)",
            }}
          >
            <Image
              src={value}
              alt={label}
              fill
              style={{ objectFit: "contain", padding: 10 }}
              sizes="200px"
            />
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Görseli kaldır"
            style={{
              position: "absolute",
              top: -7,
              right: -7,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid var(--bg-elevated, #1a1a1a)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={11} />
          </button>

          {/* Replace link */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-ink-muted hover:text-ink transition-colors"
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 11,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "var(--hl-font-ui, sans-serif)",
              padding: 0,
            }}
          >
            Değiştir
          </button>
        </div>
      ) : (
        /* ── Drop zone state ── */
        <div
          role="button"
          tabIndex={0}
          aria-label="Görsel yükle"
          onClick={() => { if (!uploading) inputRef.current?.click(); }}
          onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && !uploading) inputRef.current?.click(); }}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragEnter={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `1.5px dashed ${dragging ? "var(--hl-bronze-400, #b8893c)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 10,
            padding: "28px 20px",
            textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: dragging ? "rgba(182,137,80,0.07)" : "transparent",
            transition: "border-color 150ms ease, background 150ms ease",
            outline: "none",
          }}
        >
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Loader2
                size={22}
                className="animate-spin"
                style={{ color: "var(--hl-bronze-400, #b8893c)" }}
              />
              <span className="text-ink-muted" style={{ fontSize: 12 }}>Yükleniyor…</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Upload
                size={22}
                style={{ color: dragging ? "var(--hl-bronze-400, #b8893c)" : "rgba(255,255,255,0.3)" }}
              />
              <span className="text-ink-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Görsel sürükleyip bırakın veya tıklayıp seçin
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                JPG, PNG, WEBP, AVIF · maks. 5 MB
              </span>
            </div>
          )}
        </div>
      )}

      {/* Inline error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 6,
            color: "#f87171",
            fontSize: 12,
            fontFamily: "var(--hl-font-ui, sans-serif)",
          }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        style={{ display: "none" }}
        onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
