"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız.");
        return;
      }

      const user = data.data?.user;
      if (user?.role !== "ADMIN") {
        setError("Bu panele erişim yetkiniz bulunmuyor.");
        await fetch("/api/auth/logout", { method: "POST" });
        return;
      }

      // Tam sayfa yüklemesi zorunlu — layout Server Component'ı cookie ile yeniden render etmeli
      window.location.href = "/admin/dashboard";
    } catch {
      setError("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-4">
            <span className="text-xl font-bold text-ink">H</span>
          </div>
          <h1 className="text-xl font-bold text-ink">Half Leaf Admin</h1>
          <p className="text-sm text-ink-muted mt-1">Yönetici girişi</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-card border border-border-default rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-ink-muted mb-1.5">
              E-Posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-ink-muted mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink-muted transition-colors"
                aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-bg font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
