"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Wand2, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";

interface JobData {
  id: string;
  status: "BEKLEMEDE" | "CALISIYOR" | "TAMAMLANDI" | "HATALI";
  totalImages: number;
  processedImages: number;
  failedImages: number;
  startedAt: string | null;
  finishedAt: string | null;
  errorLog: Array<{ id: string; error: string }> | null;
  createdAt: string;
}

interface Stats {
  total: number;
  processed: number;
  pending: number;
}

export default function BulkProcessingBar() {
  const [job, setJob] = useState<JobData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showErrorLog, setShowErrorLog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCurrentJob = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/image-processing/jobs/current");
      const json = await res.json();
      if (json.success) setJob(json.data);
    } catch {
      // Non-fatal background poll
    }
  }, []);

  const fetchImageStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/image-processing/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern on mount; both calls update state via useCallback; no cascade loop
    fetchCurrentJob();
    fetchImageStats();
  }, [fetchCurrentJob, fetchImageStats]);

  // Poll every 5s while job is active
  useEffect(() => {
    const isActive =
      job?.status === "BEKLEMEDE" || job?.status === "CALISIYOR";

    if (isActive) {
      pollRef.current = setInterval(() => {
        fetchCurrentJob();
        fetchImageStats();
      }, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [job?.status, fetchCurrentJob, fetchImageStats]);

  // Refresh stats when job finishes
  useEffect(() => {
    if (job?.status === "TAMAMLANDI" || job?.status === "HATALI") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh after job status change, no cascade loop
      fetchImageStats();
    }
  }, [job?.status, fetchImageStats]);

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/image-processing/jobs", {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "İş başlatılamadı.");
      await fetchCurrentJob();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "İş başlatılırken hata oluştu."
      );
    } finally {
      setStarting(false);
    }
  };

  const isActive =
    job?.status === "BEKLEMEDE" || job?.status === "CALISIYOR";
  const progressPct =
    job && job.totalImages > 0
      ? Math.round((job.processedImages / job.totalImages) * 100)
      : 0;

  return (
    <div className="bg-bg-elevated border border-border-default rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-accent-light" />
          <h3 className="text-sm font-semibold text-ink">Görsel Dönüşüm</h3>
        </div>

        {/* Stats chips */}
        {stats && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-ink-dim">
            <span>Toplam: <strong className="text-ink">{stats.total}</strong></span>
            <span>Profesyonel: <strong className="text-emerald-400">{stats.processed}</strong></span>
            <span>Bekliyor: <strong className="text-gold">{stats.pending}</strong></span>
          </div>
        )}
      </div>

      {/* Active job progress */}
      {isActive && job && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Loader2 size={13} className="animate-spin text-accent-light" />
            <span>
              İşleniyor: {job.processedImages}/{job.totalImages} görsel
            </span>
            {job.failedImages > 0 && (
              <span className="text-red-400">{job.failedImages} hatalı</span>
            )}
          </div>
          <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Finished job result */}
      {job?.status === "TAMAMLANDI" && (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle size={13} className="text-emerald-400" />
          <span className="text-ink-muted">
            Son iş tamamlandı: {job.processedImages} başarılı
            {job.failedImages > 0 && (
              <span className="text-red-400">, {job.failedImages} başarısız</span>
            )}
          </span>
          {job.failedImages > 0 && job.errorLog && (
            <button
              onClick={() => setShowErrorLog(true)}
              className="text-accent-light hover:underline"
            >
              [Detay]
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {/* Start button */}
      <div className="flex items-center justify-between pt-1">
        {stats && (
          <div className="sm:hidden text-xs text-ink-dim">
            {stats.pending} görsel bekliyor
          </div>
        )}
        <button
          onClick={handleStart}
          disabled={isActive || starting || stats?.pending === 0}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isActive ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              İşlem Çalışıyor...
            </>
          ) : starting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Başlatılıyor...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Bekleyen Görselleri Toplu Dönüştür
              {stats?.pending ? ` (${stats.pending})` : ""}
            </>
          )}
        </button>
      </div>

      {/* Error log modal */}
      {showErrorLog && job?.errorLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 max-w-lg w-full shadow-xl space-y-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Hata Detayları</h3>
              <button
                onClick={() => setShowErrorLog(false)}
                className="p-1 text-ink-dim hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-auto flex-1 space-y-2">
              {job.errorLog.map((e, i) => (
                <div
                  key={i}
                  className="text-xs p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="text-ink-muted font-mono">{e.id}</div>
                  <div className="text-red-400 mt-0.5">{e.error}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
