"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

export default function IletisimClient({
  contactEmail,
  contactPhone,
  contactAddress,
}: {
  contactEmail:   string;
  contactPhone:   string;
  contactAddress: string;
}) {
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res  = await fetch("/api/iletisim", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:    form.name,
          email:   form.email,
          phone:   form.phone   || undefined,
          subject: form.subject || undefined,
          message: form.message,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };

      if (!json.success) {
        setError(json.error ?? "Mesajınız gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }

      setSuccess(true);
      setForm(EMPTY);
    } catch {
      setError("Bir hata oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">İletişim</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Bize Ulaşın</h1>
        <p className="text-ink-muted">Sorularınız için aşağıdaki kanallardan bize ulaşabilirsiniz.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: Mail,   label: "E-Posta", value: contactEmail,   href: `mailto:${contactEmail}` },
          { icon: Phone,  label: "Telefon", value: contactPhone,   href: `tel:${contactPhone}` },
          { icon: MapPin, label: "Adres",   value: contactAddress || "Isparta, Türkiye", href: "#" },
        ].map(({ icon: Icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            className="flex flex-col gap-3 p-5 rounded-xl bg-bg-card border border-border-default hover:border-border-light transition-colors group"
          >
            <div className="p-2.5 rounded-lg bg-bg-elevated border border-border-default w-fit">
              <Icon size={18} className="text-gold" />
            </div>
            <div>
              <p className="text-xs text-ink-dim mb-1">{label}</p>
              <p className="text-sm text-ink group-hover:text-gold transition-colors">{value}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-bg-card border border-border-default rounded-2xl p-6 sm:p-8 max-w-lg">
        <h2 className="text-xl font-semibold text-ink mb-6">İletişim Formu</h2>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-ink mb-1">Mesajınız Alındı</p>
              <p className="text-sm text-ink-muted">
                En kısa sürede size dönüş yapılacaktır. Bize yazdığınız için teşekkür ederiz.
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="mt-2 text-sm text-accent hover:text-accent-light transition-colors"
            >
              Yeni mesaj gönder
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm text-ink-muted mb-1.5">
                  Ad Soyad <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={set("name")}
                  className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim"
                  placeholder="Adınız"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-ink-muted mb-1.5">
                  E-Posta <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim"
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm text-ink-muted mb-1.5">Telefon</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim"
                  placeholder="0555 000 00 00"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm text-ink-muted mb-1.5">Konu</label>
                <input
                  id="subject"
                  type="text"
                  value={form.subject}
                  onChange={set("subject")}
                  className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim"
                  placeholder="Mesajınızın konusu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm text-ink-muted mb-1.5">
                Mesaj <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                rows={5}
                required
                value={form.message}
                onChange={set("message")}
                className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim resize-none"
                placeholder="Mesajınızı yazın..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gold text-bg font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? "Gönderiliyor…" : "Gönder"}
            </button>
          </form>
        )}

        <p className="text-xs text-ink-dim mt-4">
          Mesajınız en geç 2 iş günü içinde yanıtlanır. Kişisel verileriniz{" "}
          <a href="/yasal/kvkk" className="underline hover:text-ink-muted">KVKK kapsamında</a> işlenir.
        </p>
      </div>
    </div>
  );
}
