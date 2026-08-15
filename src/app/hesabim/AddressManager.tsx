"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { IL_NAMES, getIlceler } from "@/data/turkey-locations";

export interface SavedAddress {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  postalCode: string | null;
  isDefault: boolean;
}

interface FormState {
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  postalCode: string;
  isDefault: boolean;
}

const EMPTY: FormState = {
  title: "", fullName: "", phone: "", city: "", district: "",
  neighborhood: "", fullAddress: "", postalCode: "", isDefault: false,
};

export default function AddressManager({ initial }: { initial: SavedAddress[] }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initial);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openNew() {
    setForm(EMPTY);
    setEditingId("new");
    setError("");
  }
  function openEdit(a: SavedAddress) {
    setForm({
      title: a.title, fullName: a.fullName, phone: a.phone, city: a.city,
      district: a.district, neighborhood: a.neighborhood, fullAddress: a.fullAddress,
      postalCode: a.postalCode ?? "", isDefault: a.isDefault,
    });
    setEditingId(a.id);
    setError("");
  }
  function close() { setEditingId(null); setError(""); }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v, ...(k === "city" ? { district: "" } : {}) }));
  }

  async function refresh() {
    try {
      const res = await fetch("/api/hesabim/adresler");
      const j = await res.json() as { success: boolean; data?: SavedAddress[] };
      if (j.success && j.data) setAddresses(j.data);
    } catch { /* ignore */ }
  }

  async function save() {
    setError("");
    if (!form.title.trim() || !form.fullName.trim() || form.phone.replace(/\D/g, "").length < 10 || !form.city || !form.district || form.fullAddress.trim().length < 5) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    setBusy(true);
    try {
      const url = editingId === "new" ? "/api/hesabim/adresler" : `/api/hesabim/adresler/${editingId}`;
      const method = editingId === "new" ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await res.json() as { success: boolean; error?: string };
      if (!j.success) { setError(j.error ?? "Kaydedilemedi."); return; }
      await refresh();
      close();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu adres silinecek. Onaylıyor musunuz?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/hesabim/adresler/${id}`, { method: "DELETE" });
      const j = await res.json() as { success: boolean };
      if (j.success) await refresh();
    } finally { setBusy(false); }
  }

  async function makeDefault(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/hesabim/adresler/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
      const j = await res.json() as { success: boolean };
      if (j.success) await refresh();
    } finally { setBusy(false); }
  }

  return (
    <div>
      {addresses.length === 0 && editingId === null && (
        <p style={{ fontSize: 12, color: "var(--hl-text-mute)", lineHeight: 1.6, marginBottom: 14 }}>
          Kayıtlı adresiniz bulunmuyor. Hızlı ödeme için adres ekleyin.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {addresses.map((a) => (
          <div key={a.id} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-text)" }}>{a.title}</span>
              {a.isDefault && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--hl-bronze-400)", padding: "2px 7px", borderRadius: 99, border: "1px solid var(--hl-bronze-400)" }}>Varsayılan</span>
              )}
              <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a.id)} disabled={busy} title="Varsayılan yap" style={iconBtn}><Check size={14} /></button>
                )}
                <button type="button" onClick={() => openEdit(a)} disabled={busy} title="Düzenle" style={iconBtn}><Pencil size={13} /></button>
                <button type="button" onClick={() => remove(a.id)} disabled={busy} title="Sil" style={{ ...iconBtn, color: "#e05252" }}><Trash2 size={13} /></button>
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--hl-text-soft)", lineHeight: 1.6, margin: 0 }}>
              {a.fullName} · {a.phone}<br />
              {a.fullAddress}{a.neighborhood ? `, ${a.neighborhood}` : ""}<br />
              {a.district}, {a.city}{a.postalCode ? ` ${a.postalCode}` : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Form */}
      {editingId !== null && (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: "var(--hl-bg)", border: "1px solid var(--hl-bronze-700)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)" }}>{editingId === "new" ? "Yeni Adres" : "Adresi Düzenle"}</span>
            <button type="button" onClick={close} style={{ ...iconBtn, color: "var(--hl-text-mute)" }}><X size={15} /></button>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Başlık (Ev, İş…)" style={inp} />
            <div className="hl-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Ad Soyad" style={inp} />
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Telefon" style={inp} />
            </div>
            <div className="hl-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select value={form.city} onChange={(e) => set("city", e.target.value)} style={inp}>
                <option value="">İl seçin…</option>
                {IL_NAMES.map((il) => <option key={il} value={il}>{il}</option>)}
              </select>
              <select value={form.district} onChange={(e) => set("district", e.target.value)} style={inp} disabled={!form.city}>
                <option value="">{form.city ? "İlçe seçin…" : "Önce il"}</option>
                {getIlceler(form.city).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Mahalle (opsiyonel)" style={inp} />
            <textarea value={form.fullAddress} onChange={(e) => set("fullAddress", e.target.value)} placeholder="Açık adres (cadde, sokak, kapı no)" rows={2} style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
            <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="Posta Kodu (opsiyonel)" style={{ ...inp, maxWidth: 160 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--hl-text-soft)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
              Varsayılan adres yap
            </label>
            {error && <p style={{ fontSize: 12, color: "#e05252" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={save} disabled={busy} style={{ padding: "10px 22px", borderRadius: 8, background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)", border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: busy ? "default" : "pointer" }}>
                {busy ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button type="button" onClick={close} style={{ padding: "10px 22px", borderRadius: 8, background: "transparent", color: "var(--hl-text-soft)", border: "1px solid var(--hl-line-strong)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {editingId === null && (
        <button type="button" onClick={openNew} style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: "var(--hl-r-pill)", background: "transparent", border: "1.5px solid var(--hl-bronze-700)", color: "var(--hl-bronze-400)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
          <Plus size={14} /> Yeni Adres Ekle
        </button>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, display: "grid", placeItems: "center",
  background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line-strong)",
  color: "var(--hl-text-soft)", cursor: "pointer",
};

const inp: React.CSSProperties = {
  width: "100%", height: 42, background: "var(--hl-bg-elev-1)",
  border: "1px solid var(--hl-line-strong)", borderRadius: 8, padding: "0 12px",
  color: "var(--hl-text)", fontSize: 13, fontFamily: "var(--hl-font-ui)", outline: "none",
};
