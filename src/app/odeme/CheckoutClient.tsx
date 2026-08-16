"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Check, Shield, Truck, X, ChevronDown, ChevronLeft, MapPin, User, ArrowRight, RotateCcw } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { reconcileCartStock, type StockNotice } from "@/lib/cart/reconcile";
import { useCartStockReconcile } from "@/hooks/useCartStockReconcile";
import StockNoticeBanner from "@/components/cart/StockNoticeBanner";
import { formatPrice } from "@/lib/utils";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import { IL_NAMES, getIlceler } from "@/data/turkey-locations";
import PayTrLogo from "@/components/layout/PayTrLogo";
import CardSchemes from "@/components/layout/CardSchemes";

type ShippingMethod = "AYNI_GUN" | "YURT_ICI" | "DUKKAN_TESLIM" | string;
type PaymentMethod = "KREDI_KARTI" | "HAVALE_EFT";
type FieldErrors = Record<string, string>;
type AuthStep = "checking" | "selection" | "flow";
interface AppliedCoupon { code: string; discountAmount: number }
interface CheckoutShippingOption { id: string; label: string; desc: string; alwaysFree: boolean; price: number }
interface CheckoutBankAccount { id: string; bankName: string; iban: string; accountName: string }
interface SavedAddress {
  id: string; title: string; fullName: string; phone: string;
  fullAddress: string; district: string; city: string;
  postalCode: string | null; isDefault: boolean;
}

/* ─── Fallback shipping options (used if DB returns empty) ─── */
const FALLBACK_SHIPPING: CheckoutShippingOption[] = [
  { id: "AYNI_GUN",      label: "Aynı Gün Kargo",               desc: "14:00'ten önce verilen siparişler aynı gün kargolanır",           alwaysFree: false, price: 150 },
  { id: "YURT_ICI",      label: "Yurt İçi Kargo",               desc: "1-2 iş günü · MNG Kargo",                                        alwaysFree: false, price: 150 },
  { id: "DUKKAN_TESLIM", label: "Dükkandan Teslim Al (Isparta)", desc: "Isparta içi — siparişiniz hazır olduğunda mağazadan alabilirsiniz", alwaysFree: true,  price: 0   },
];

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "KREDI_KARTI", label: "Kredi / Banka Kartı" },
  { id: "HAVALE_EFT",  label: "Havale / EFT"        },
];

/* ─── prefers-reduced-motion'a saygılı kaydırma davranışı ─── */
function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/* ─── CheckoutHeader ─── */
function CheckoutHeader({ step }: { step: 1 | 2 }) {
  const stepsData = [
    { n: "01", label: "Sepet",    state: "done"                      },
    { n: "02", label: "Teslimat", state: step === 1 ? "active" : "done" },
    { n: "03", label: "Ödeme",    state: step === 2 ? "active" : ""  },
  ];
  return (
    <header className="hl-checkout-header" style={{
      padding: "16px 40px", display: "flex", justifyContent: "space-between",
      alignItems: "center", borderBottom: "1px solid var(--hl-line)",
    }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <HalfLeafLogo width={13} height={22} />
        <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)" }}>
          Half Leaf
        </span>
      </Link>

      <div className="hl-checkout-steps" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {stepsData.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {i > 0 && <span style={{ width: 20, height: 1, background: "var(--hl-line-strong)" }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 999,
                background: s.state === "active" ? "var(--hl-bronze-400)" : s.state === "done" ? "var(--hl-bg-elev-3)" : "transparent",
                color: s.state === "active" ? "#1A1206" : "var(--hl-text-soft)",
                border: s.state === "" ? "1px solid var(--hl-line-strong)" : "1px solid transparent",
                display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, fontFamily: "var(--hl-font-ui)",
              }}>
                {s.state === "done" ? <Check size={10} color="var(--hl-success)" strokeWidth={2.5} /> : s.n}
              </span>
              <span style={{
                fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                color: s.state === "active" ? "var(--hl-text)" : "var(--hl-text-mute)",
                fontWeight: 600, fontFamily: "var(--hl-font-ui)",
              }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--hl-text-soft)", fontSize: 11, fontFamily: "var(--hl-font-ui)" }}>
        <Lock size={12} /> Güvenli
      </div>
    </header>
  );
}

/* ─── Panel ─── */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)", borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontFamily: "var(--hl-font-display)", fontSize: 21, margin: "0 0 20px 0", fontWeight: 500, letterSpacing: "-0.005em", color: "var(--hl-text)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Field ─── */
function Field({ label, value, onChange, error, type = "text", placeholder = "", prefix, id }: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; placeholder?: string; prefix?: string; id?: string;
}) {
  return (
    <div id={id} style={{ scrollMarginTop: 90 }}>
      <label style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", fontWeight: 600, display: "block", marginBottom: 6, fontFamily: "var(--hl-font-ui)" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", background: "var(--hl-bg)", borderRadius: 8, height: 44, border: `1px solid ${error ? "#e05252" : "var(--hl-line-strong)"}` }}>
        {prefix && (
          <span style={{ padding: "0 10px 0 14px", fontSize: 13, fontWeight: 600, color: "var(--hl-text-soft)", fontFamily: "var(--hl-font-ui)", borderRight: "1px solid var(--hl-line-strong)", height: "100%", display: "flex", alignItems: "center", flexShrink: 0, whiteSpace: "nowrap" }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, background: "transparent", border: 0, outline: 0, color: "var(--hl-text)", fontSize: 14, fontFamily: "var(--hl-font-ui)", padding: prefix ? "0 14px" : "0 14px" }}
        />
      </div>
      {error && <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 10, color: "#e05252", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ─── SelectField ─── */
function SelectField({ label, value, onChange, options, error, placeholder, id }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; error?: string; placeholder?: string; id?: string;
}) {
  return (
    <div id={id} style={{ scrollMarginTop: 90 }}>
      <label style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", fontWeight: 600, display: "block", marginBottom: 6, fontFamily: "var(--hl-font-ui)" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", background: "var(--hl-bg)", borderRadius: 8, height: 44, border: `1px solid ${error ? "#e05252" : "var(--hl-line-strong)"}`, padding: "0 14px" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: 0, outline: 0, color: value ? "var(--hl-text)" : "var(--hl-text-mute)", fontSize: 14, fontFamily: "var(--hl-font-ui)", appearance: "none", cursor: "pointer" }}
        >
          <option value="">{placeholder ?? "Seçin…"}</option>
          {options.map(o => <option key={o} value={o} style={{ background: "#1B1D19" }}>{o}</option>)}
        </select>
        <ChevronDown size={13} style={{ color: "var(--hl-text-mute)", flexShrink: 0, pointerEvents: "none" }} />
      </div>
      {error && <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 10, color: "#e05252", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ─── RadioDot ─── */
function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0, border: checked ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)", display: "grid", placeItems: "center" }}>
      {checked && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--hl-bronze-400)" }} />}
    </span>
  );
}

/* ─── CheckBox ─── */
function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: checked ? "var(--hl-bronze-400)" : "transparent", border: checked ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)", display: "grid", placeItems: "center", cursor: "pointer" }}>
      {checked && <Check size={10} color="#1A1206" strokeWidth={2.5} />}
    </button>
  );
}

/* ─── Main ─── */
export default function CheckoutClient({
  freeShippingThreshold = 2500,
  shippingCost          = 150,
  bankTransferEnabled   = true,
  shippingOptions,
  bankAccounts          = [],
}: {
  freeShippingThreshold?: number;
  shippingCost?:          number;
  bankTransferEnabled?:   boolean;
  shippingOptions?:       CheckoutShippingOption[];
  bankAccounts?:          CheckoutBankAccount[];
}) {
  const SHIPPING_OPTIONS = shippingOptions ?? FALLBACK_SHIPPING;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  /* Auth */
  const [authStep, setAuthStep] = useState<AuthStep>("checking");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  /* Contact */
  const [email, setEmail] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [smsConsent, setSmsConsent] = useState(true);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);

  /* Address */
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [adres, setAdres] = useState("");
  const [selectedIl, setSelectedIl] = useState("");
  const [selectedIlce, setSelectedIlce] = useState("");
  const [postaKodu, setPostaKodu] = useState("");
  const ilceOptions = getIlceler(selectedIl);

  /* Options */
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("YURT_ICI");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("KREDI_KARTI");

  /* Coupon */
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const couponRef = useRef<HTMLInputElement>(null);

  /* Consent + submit */
  const [consentChecked, setConsentChecked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* Stock reconcile + scroll-to-error refs */
  const [stockNotice, setStockNotice] = useState<StockNotice | null>(null);
  const consentRef = useRef<HTMLDivElement>(null);
  const submitErrorRef = useRef<HTMLDivElement>(null);

  const { items, clearCart } = useCartStore();
  const customerNote = useCartStore((s) => s.note);
  const setCustomerNote = useCartStore((s) => s.setNote);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must run after SSR mount
    setMounted(true);

    type MeData = {
      email?: string; fullName?: string; phone?: string;
      Address?: SavedAddress[];
    };

    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? (r.json() as Promise<{ data?: MeData }>) : null)
      .then(resp => {
        const data = resp?.data;
        if (data) {
          setIsLoggedIn(true);
          if (data.email) setEmail(data.email);
          if (data.fullName) {
            const parts = data.fullName.trim().split(" ");
            setAd(parts[0] ?? "");
            setSoyad(parts.slice(1).join(" "));
          }
          if (data.phone) setPhoneSuffix(data.phone.replace("+90", ""));
          if (data.Address && data.Address.length > 0) {
            setSavedAddresses(data.Address);
            const def = data.Address.find(a => a.isDefault) ?? data.Address[0];
            setSelectedAddressId(def.id);
            const parts = def.fullName.trim().split(" ");
            setAd(parts[0] ?? "");
            setSoyad(parts.slice(1).join(" "));
            setAdres(def.fullAddress);
            setSelectedIl(def.city);
            setSelectedIlce(def.district);
            setPostaKodu(def.postalCode ?? "");
          }
          setAuthStep("flow");
        } else {
          setAuthStep("selection");
        }
      })
      .catch(() => setAuthStep("selection"));
  }, []);

  // Stok düzeltmesi olduğunda: bandı göster ve uygulanmış kuponu temizle.
  // Sepet küçüldüyse kupon alt-limiti artık sağlanmıyor olabilir; sunucu kuponu
  // iptal edip daha yüksek tutarı çekebilir. Kuponu temizleyip kullanıcıdan
  // yeniden uygulamasını isteyerek gösterilen tutar ile çekilen tutarı eşleriz.
  const handleStockNotice = useCallback((notice: StockNotice) => {
    setStockNotice(notice);
    setAppliedCoupon((c) => (c ? null : c));
  }, []);

  // Hidrasyon bitince + sekme tekrar öne geldiğinde sepeti güncel stoğa göre düzelt.
  useCartStockReconcile(handleStockNotice);

  // Sunucu/gönderim hatası belirince hata kutusuna kaydır (özellikle mobilde
  // özet alt tarafta olduğundan kullanıcı uyarıyı görsün).
  useEffect(() => {
    if (!submitError) return;
    requestAnimationFrame(() => {
      submitErrorRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    });
  }, [submitError]);

  const handleIlChange = (v: string) => { setSelectedIl(v); setSelectedIlce(""); };

  const handleAddressSelect = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    const parts = addr.fullName.trim().split(" ");
    setAd(parts[0] ?? "");
    setSoyad(parts.slice(1).join(" "));
    setAdres(addr.fullAddress);
    setSelectedIl(addr.city);
    setSelectedIlce(addr.district);
    setPostaKodu(addr.postalCode ?? "");
  };

  if (!mounted || authStep === "checking") return (
    <div style={{ minHeight: "100vh", background: "var(--hl-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
      Yükleniyor…
    </div>
  );

  if (items.length === 0) return (
    <div style={{ minHeight: "100vh", background: "var(--hl-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "var(--hl-font-ui)", padding: "24px" }}>
      {stockNotice && (
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StockNoticeBanner notice={stockNotice} onDismiss={() => setStockNotice(null)} />
        </div>
      )}
      <p style={{ fontSize: 14, color: "var(--hl-text-mute)" }}>
        {stockNotice ? "Stok durumu nedeniyle sepetiniz boşaldı." : "Sepetiniz boş."}
      </p>
      <Link href="/urunler" style={{ padding: "11px 28px", borderRadius: "var(--hl-r-pill)", background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
        Alışverişe Dön
      </Link>
    </div>
  );

  /* ── Auth selection screen ── */
  if (authStep === "selection") return (
    <div style={{ background: "var(--hl-bg)", minHeight: "100vh", color: "var(--hl-text)", fontFamily: "var(--hl-font-ui)" }}>
      <CheckoutHeader step={1} />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px 80px", textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 10 }}>
          Ödeme
        </p>
        <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)", lineHeight: 1.1, margin: "0 0 10px" }}>
          Nasıl devam etmek istersiniz?
        </h1>
        <p style={{ fontSize: 12, color: "var(--hl-text-mute)", marginBottom: 36, lineHeight: 1.6 }}>
          Üye girişi yaparak siparişlerinizi takip edebilirsiniz.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Login option */}
          <Link href="/giris?redirect=/odeme" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "20px 22px", borderRadius: 12,
              background: "var(--hl-bg-elev-1)", border: "1.5px solid var(--hl-bronze-400)",
              display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
              transition: "background 150ms ease",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(182,137,80,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <User size={18} color="var(--hl-bronze-400)" />
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-text)", marginBottom: 3 }}>Üye Girişi Yap</div>
                <div style={{ fontSize: 11, color: "var(--hl-text-mute)", lineHeight: 1.5 }}>
                  Kayıtlı adresleriniz otomatik doldurulur
                </div>
              </div>
              <ArrowRight size={16} color="var(--hl-bronze-400)" />
            </div>
          </Link>

          {/* Guest option */}
          <button
            type="button"
            onClick={() => setAuthStep("flow")}
            style={{
              padding: "20px 22px", borderRadius: 12, width: "100%",
              background: "var(--hl-bg-elev-1)", border: "1.5px solid var(--hl-line-strong)",
              display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
              transition: "border-color 150ms ease", fontFamily: "var(--hl-font-ui)",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--hl-bg-elev-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <ArrowRight size={18} color="var(--hl-text-soft)" />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-text)", marginBottom: 3 }}>Üye Olmadan Devam Et</div>
              <div style={{ fontSize: 11, color: "var(--hl-text-mute)", lineHeight: 1.5 }}>
                Hesap oluşturmadan misafir olarak devam et
              </div>
            </div>
            <ArrowRight size={16} color="var(--hl-text-mute)" />
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: 11, color: "var(--hl-text-mute)" }}>
          Hesabınız yok mu?{" "}
          <Link href="/kayit?redirect=/odeme" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>
            Kayıt ol
          </Link>
        </p>
      </div>

      <footer className="hl-checkout-footer" style={{ borderTop: "1px solid var(--hl-line)", padding: "14px 40px", display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--hl-text-mute)", fontFamily: "var(--hl-font-ui)" }}>
        <span>© {new Date().getFullYear()} Half Leaf · Yalnızca 18 yaş üstü için</span>
        <span style={{ display: "flex", gap: 16 }}>
          <Link href="/iletisim" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>İletişim</Link>
          <Link href="/yardim/sss" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>Yardım</Link>
          <Link href="/yasal/kvkk" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>KVKK</Link>
        </span>
      </footer>
    </div>
  );

  /* ── Computed ── */
  const isPickup = shippingMethod === "DUKKAN_TESLIM";
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const baseShipping    = afterDiscount >= freeShippingThreshold ? 0 : shippingCost;
  const effectiveShipping = isPickup ? 0 : baseShipping;
  const total           = afterDiscount + effectiveShipping;

  /* ── Coupon ── */
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true); setCouponError("");
    try {
      const res = await fetch("/api/kupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal }) });
      const data = await res.json() as { discountAmount?: number; code?: string; error?: string };
      if (!res.ok || data.error) { setCouponError(data.error ?? "Kupon geçersiz."); }
      else { setAppliedCoupon({ code: data.code!, discountAmount: data.discountAmount! }); }
    } catch { setCouponError("Bir hata oluştu."); }
    finally { setCouponLoading(false); }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(""); setCouponError(""); setTimeout(() => couponRef.current?.focus(), 50); };

  /* ── Eksik/hatalı ilk alana kaydır + odakla ── */
  const scrollToField = (elementId: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(elementId);
    if (!el) return;
    el.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    const focusable = el.querySelector("input, select, textarea") as HTMLElement | null;
    focusable?.focus({ preventScroll: true });
  };

  /* ── Step 1 continue ── */
  const handleContinueToPayment = () => {
    const errors: FieldErrors = {};
    if (!email.trim() || !email.includes("@")) errors.email = "Geçerli bir e-posta adresi girin";
    if (phoneSuffix.replace(/\D/g, "").length < 10) errors.phone = "10 haneli numara girin (başında 0 olmadan)";
    if (!ad.trim()) errors.ad = "Ad zorunludur";
    if (!soyad.trim()) errors.soyad = "Soyad zorunludur";
    if (!isPickup) {
      if (!adres.trim()) errors.adres = "Adres zorunludur";
      if (!selectedIl) errors.il = "İl seçin";
      if (!selectedIlce) errors.ilce = "İlçe seçin";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Sayfayı ilk eksik alana kaydır (görünüm sırasına göre).
      const order: [keyof FieldErrors, string][] = [
        ["email", "f-email"], ["phone", "f-phone"], ["ad", "f-ad"], ["soyad", "f-soyad"],
        ["adres", "f-adres"], ["il", "f-il"], ["ilce", "f-ilce"],
      ];
      const first = order.find(([key]) => errors[key]);
      if (first) {
        const [key, elId] = first;
        const addressKeys: (keyof FieldErrors)[] = ["adres", "il", "ilce"];
        // Kayıtlı adres modunda adres alanları gizli olabilir → önce "Yeni Adres"
        // formunu aç ki kaydırılacak alan DOM'da bulunsun.
        if (addressKeys.includes(key) && !document.getElementById(elId) && selectedAddressId !== "new") {
          setSelectedAddressId("new");
          setTimeout(() => scrollToField(elId), 80);
        } else {
          requestAnimationFrame(() => scrollToField(elId));
        }
      }
      return;
    }
    setFieldErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setFieldErrors({ consent: "Devam etmek için 18 yaş ve sözleşmeleri onaylamanız gerekir." });
      // Onay kutusuna kaydır + dikkat çekmek için titret.
      requestAnimationFrame(() => {
        consentRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
        const node = consentRef.current;
        if (node) {
          node.classList.remove("hl-shake");
          // reflow ile animasyonu yeniden tetikle
          void node.offsetWidth;
          node.classList.add("hl-shake");
        }
      });
      return;
    }
    setIsSubmitting(true); setSubmitError("");

    // Son bir stok doğrulaması — form doldurulurken başka biri son ürünü almış
    // olabilir. Değişiklik varsa siparişe gitme; kullanıcı güncel sepeti görsün.
    const stockCheck = await reconcileCartStock();
    if (stockCheck) {
      handleStockNotice(stockCheck);
      setIsSubmitting(false);
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: scrollBehavior() }));
      return;
    }

    try {
      const res = await fetch("/api/siparis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { email, phone: "+90" + phoneSuffix.replace(/\s/g, ""), smsConsent, emailMarketingConsent },
          address: { ad, soyad, adres: isPickup ? "Mağazadan Teslim" : adres, ilce: isPickup ? "Merkez" : selectedIlce, sehir: isPickup ? "Isparta" : selectedIl, postaKodu },
          shippingMethod,
          paymentMethod,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
          couponCode: appliedCoupon?.code,
          customerNote: customerNote.trim() || undefined,
        }),
      });
      const data = await res.json() as { orderNumber?: string; orderToken?: string; paymentMethod?: PaymentMethod; error?: string };
      if (!res.ok) {
        if (res.status === 429) {
          setSubmitError(data.error ?? "Çok fazla sipariş denemesi yapıldı. Lütfen bir süre sonra tekrar deneyin.");
        } else if (res.status >= 500) {
          setSubmitError("Sunucuda beklenmedik bir hata oluştu, lütfen daha sonra tekrar deneyin.");
        } else {
          setSubmitError(data.error ?? "Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
        }
        return;
      }

      // orderToken: sipariş durum sayfalarının gizli erişim anahtarı — sipariş
      // numarası tek başına o sayfaları açmaya yetmez.
      const tokenQuery = data.orderToken ? `t=${encodeURIComponent(data.orderToken)}` : "";
      if (data.paymentMethod === "KREDI_KARTI") {
        // Kart ödemesi: PayTR güvenli ödeme sayfasına yönlendir.
        // Sepet, ödeme onaylanana kadar TEMİZLENMEZ (başarısızlıkta tekrar denenebilsin).
        router.push(`/odeme/paytr/${data.orderNumber}${tokenQuery ? `?${tokenQuery}` : ""}`);
      } else {
        // Havale/EFT: sipariş alındı, sepeti temizle ve onay sayfasına git.
        clearCart();
        router.push(`/siparis-tamamlandi?no=${encodeURIComponent(data.orderNumber ?? "")}${tokenQuery ? `&${tokenQuery}` : ""}`);
      }
    } catch { setSubmitError("Bir hata oluştu. Lütfen tekrar deneyin."); }
    finally { setIsSubmitting(false); }
  };

  const panelStyle: React.CSSProperties = { background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)", borderRadius: 14, padding: 24 };

  return (
    <div style={{ background: "var(--hl-bg)", minHeight: "100vh", color: "var(--hl-text)", fontFamily: "var(--hl-font-ui)" }}>
      <CheckoutHeader step={step} />

      {stockNotice && (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 40px 0" }} className="hl-checkout-notice">
          <StockNoticeBanner notice={stockNotice} onDismiss={() => setStockNotice(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "36px 40px 72px", display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 32, alignItems: "start" }} className="hl-checkout-grid">

          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* STEP 1: Teslimat */}
            {step === 1 && (
              <>
                {/* 01 · İletişim */}
                <Panel title="01 · İletişim">
                  <div className="hl-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field id="f-email" label="E-posta" value={email} onChange={setEmail} error={fieldErrors.email} type="email" placeholder="ornek@eposta.com" />
                    <Field id="f-phone" label="Telefon" value={phoneSuffix} onChange={setPhoneSuffix} error={fieldErrors.phone} placeholder="532 000 00 00" prefix="+90" />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, fontSize: 12, color: "var(--hl-text-soft)", cursor: "pointer" }}>
                    <CheckBox checked={smsConsent} onChange={() => setSmsConsent(v => !v)} />
                    Sipariş güncellemeleri için SMS gönderilsin
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 12, color: "var(--hl-text-soft)", cursor: "pointer" }}>
                    <CheckBox checked={emailMarketingConsent} onChange={() => setEmailMarketingConsent(v => !v)} />
                    Kampanya ve özel fırsatlardan e-posta ile haberdar olmak istiyorum
                  </label>
                </Panel>

                {/* 02 · Teslimat Adresi */}
                <Panel title="02 · Teslimat Adresi">
                  <div className="hl-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field id="f-ad" label="Ad" value={ad} onChange={setAd} error={fieldErrors.ad} />
                    <Field id="f-soyad" label="Soyad" value={soyad} onChange={setSoyad} error={fieldErrors.soyad} />
                  </div>

                  {isPickup ? (
                    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "var(--hl-olive-900)", border: "1px solid var(--hl-olive-700)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <MapPin size={14} style={{ color: "var(--hl-bronze-400)", flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--hl-text)", marginBottom: 4 }}>Mağazadan Teslim Al</p>
                        <p style={{ fontSize: 11, color: "var(--hl-text-mute)", lineHeight: 1.6 }}>
                          Siparişiniz hazır olduğunda Isparta mağazamızdan teslim alabilirsiniz.<br />
                          Adres bilgisi gerekmez — iletişim bilgileriniz yeterli.
                        </p>
                      </div>
                    </div>
                  ) : isLoggedIn && savedAddresses.length > 0 ? (
                    /* Saved addresses for logged-in users */
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {savedAddresses.map(addr => {
                          const isActive = selectedAddressId === addr.id;
                          return (
                            <label key={addr.id} style={{
                              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                              borderRadius: 10, cursor: "pointer",
                              background: isActive ? "rgba(182,137,80,0.05)" : "var(--hl-bg)",
                              border: isActive ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)",
                            }}>
                              <RadioDot checked={isActive} />
                              <input type="radio" name="savedAddress" value={addr.id} checked={isActive} onChange={() => handleAddressSelect(addr)} style={{ display: "none" }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-text)" }}>{addr.title}</span>
                                  {addr.isDefault && (
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--hl-bronze-400)", padding: "1px 6px", borderRadius: 99, border: "1px solid var(--hl-bronze-400)" }}>
                                      Varsayılan
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: 11, color: "var(--hl-text-mute)", lineHeight: 1.6, margin: 0 }}>
                                  {addr.fullName} · {addr.phone}<br />
                                  {addr.fullAddress}, {addr.district}, {addr.city}
                                  {addr.postalCode ? ` ${addr.postalCode}` : ""}
                                </p>
                              </div>
                            </label>
                          );
                        })}

                        {/* New address option */}
                        <label style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                          borderRadius: 10, cursor: "pointer",
                          background: selectedAddressId === "new" ? "rgba(182,137,80,0.05)" : "var(--hl-bg)",
                          border: selectedAddressId === "new" ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)",
                        }}>
                          <RadioDot checked={selectedAddressId === "new"} />
                          <input type="radio" name="savedAddress" value="new" checked={selectedAddressId === "new"} onChange={() => setSelectedAddressId("new")} style={{ display: "none" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hl-text)" }}>+ Yeni Adres</span>
                        </label>
                      </div>

                      {/* Show form only when "Yeni Adres" is selected */}
                      {selectedAddressId === "new" && (
                        <>
                          <div style={{ marginTop: 14 }}>
                            <Field id="f-adres" label="Adres" value={adres} onChange={setAdres} error={fieldErrors.adres} placeholder="Mahalle, cadde, sokak, kapı no" />
                          </div>
                          <div className="hl-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                            <SelectField id="f-il" label="İl" value={selectedIl} onChange={handleIlChange} options={IL_NAMES} error={fieldErrors.il} placeholder="İl seçin…" />
                            <SelectField id="f-ilce" label="İlçe" value={selectedIlce} onChange={setSelectedIlce} options={ilceOptions} error={fieldErrors.ilce} placeholder={selectedIl ? "İlçe seçin…" : "Önce il seçin"} />
                          </div>
                          <div style={{ marginTop: 14, maxWidth: 160 }}>
                            <Field label="Posta Kodu" value={postaKodu} onChange={setPostaKodu} placeholder="34000" />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ marginTop: 14 }}>
                        <Field id="f-adres" label="Adres" value={adres} onChange={setAdres} error={fieldErrors.adres} placeholder="Mahalle, cadde, sokak, kapı no" />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                        <SelectField id="f-il" label="İl" value={selectedIl} onChange={handleIlChange} options={IL_NAMES} error={fieldErrors.il} placeholder="İl seçin…" />
                        <SelectField id="f-ilce" label="İlçe" value={selectedIlce} onChange={setSelectedIlce} options={ilceOptions} error={fieldErrors.ilce} placeholder={selectedIl ? "İlçe seçin…" : "Önce il seçin"} />
                      </div>
                      <div style={{ marginTop: 14, maxWidth: 160 }}>
                        <Field label="Posta Kodu" value={postaKodu} onChange={setPostaKodu} placeholder="34000" />
                      </div>
                    </>
                  )}
                </Panel>

                {/* 03 · Teslimat Yöntemi */}
                <Panel title="03 · Teslimat Yöntemi">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {SHIPPING_OPTIONS.map(opt => {
                      const isActive = shippingMethod === opt.id;
                      const cost = opt.alwaysFree ? 0 : baseShipping;
                      const priceLabel = cost === 0 ? "Ücretsiz" : formatPrice(cost);
                      return (
                        <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: isActive ? "rgba(182,137,80,0.06)" : "transparent", border: isActive ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)", borderRadius: 10, cursor: "pointer" }}>
                          <RadioDot checked={isActive} />
                          <input type="radio" name="shippingMethod" value={opt.id} checked={isActive} onChange={() => setShippingMethod(opt.id)} style={{ display: "none" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hl-text)" }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: "var(--hl-text-mute)", marginTop: 2 }}>{opt.desc}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: cost === 0 ? "var(--hl-success)" : "var(--hl-text)", whiteSpace: "nowrap" }}>{priceLabel}</div>
                        </label>
                      );
                    })}
                  </div>
                </Panel>
              </>
            )}

            {/* STEP 2: Ödeme */}
            {step === 2 && (
              <Panel title="04 · Ödeme">
                {/* Payment tabs */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  {PAYMENT_OPTIONS.filter(opt => opt.id !== "HAVALE_EFT" || bankTransferEnabled).map(opt => {
                    const isActive = paymentMethod === opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={() => setPaymentMethod(opt.id)} style={{ flex: 1, padding: "13px 10px", borderRadius: 10, background: isActive ? "var(--hl-bg-elev-3)" : "transparent", border: isActive ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)", color: "var(--hl-text)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--hl-font-ui)", transition: "all 150ms ease" }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Payment info */}
                <div style={{ padding: "16px 18px", borderRadius: 10, background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)", fontSize: 12, color: "var(--hl-text-soft)", lineHeight: 1.7, marginBottom: 20 }}>
                  {paymentMethod === "KREDI_KARTI" && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: "var(--hl-text)" }}>Kredi / Banka Kartı ile Ödeme</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <PayTrLogo />
                          <CardSchemes height={18} />
                        </span>
                      </div>
                      Siparişi onayladıktan sonra <strong style={{ color: "var(--hl-text-soft)" }}>PayTR</strong> güvenli ödeme ekranına yönlendirileceksiniz.
                      Kart bilgileriniz 256-bit SSL ve 3D Secure ile şifrelenir; tek çekim veya taksit seçenekleri ödeme ekranında sunulur.
                    </>
                  )}
                  {paymentMethod === "HAVALE_EFT" && (
                    <>
                      <div style={{ fontWeight: 600, color: "var(--hl-text)", marginBottom: 8 }}>Havale / EFT Bilgileri</div>
                      {bankAccounts.length > 0 ? bankAccounts.map(b => (
                        <div key={b.id} style={{ marginBottom: 8 }}>
                          <div>Banka: <span style={{ color: "var(--hl-text)" }}>{b.bankName}</span></div>
                          <div>Hesap Sahibi: <span style={{ color: "var(--hl-text)" }}>{b.accountName}</span></div>
                          <div>IBAN: <span style={{ fontFamily: "var(--hl-font-mono)", color: "var(--hl-text)", fontSize: 11 }}>{b.iban}</span></div>
                        </div>
                      )) : (
                        <div style={{ fontSize: 12, color: "var(--hl-text-mute)" }}>Banka hesabı bilgileri için lütfen bizimle iletişime geçin.</div>
                      )}
                      <div style={{ marginTop: 6, fontSize: 11 }}>Açıklamaya sipariş numaranızı yazmayı unutmayın.</div>
                    </>
                  )}
                </div>

                {/* Sipariş notu (opsiyonel) */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--hl-text)", marginBottom: 8 }}>
                    Sipariş Notu <span style={{ color: "var(--hl-text-mute)", fontWeight: 400 }}>(opsiyonel)</span>
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Teslimat veya ürünle ilgili eklemek istediğiniz not (ör. zile basmadan arayın, hediye paketi…)"
                    style={{
                      width: "100%", background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)",
                      borderRadius: 10, padding: "12px 14px", color: "var(--hl-text)", fontSize: 13,
                      fontFamily: "var(--hl-font-ui)", lineHeight: 1.6, resize: "vertical", outline: "none",
                    }}
                  />
                </div>

                {/* Legal consent */}
                <div ref={consentRef} style={{
                  padding: "14px 16px", borderRadius: 10, scrollMarginTop: 90,
                  background: "var(--hl-olive-900)", border: `1px solid ${fieldErrors.consent ? "#e05252" : "var(--hl-olive-700)"}`,
                }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--hl-text-soft)", cursor: "pointer" }}>
                    <CheckBox checked={consentChecked} onChange={() => {
                      setConsentChecked(v => !v);
                      if (fieldErrors.consent) setFieldErrors(prev => { const n = { ...prev }; delete n.consent; return n; });
                    }} />
                    <span>
                      <strong style={{ color: "var(--hl-text)" }}>18 yaşından büyük olduğumu</strong> ve{" "}
                      <Link href="/yasal/mesafeli-satis-sozlesmesi" target="_blank" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>Mesafeli Satış Sözleşmesi</Link>
                      {", "}
                      <Link href="/yasal/on-bilgilendirme-formu" target="_blank" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>Ön Bilgilendirme Formu</Link>
                      {" ve "}
                      <Link href="/yasal/kvkk" target="_blank" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>KVKK Aydınlatma Metni</Link>
                      &apos;ni okuyup kabul ettiğimi onaylıyorum.
                    </span>
                  </label>
                  {fieldErrors.consent && <p style={{ fontSize: 10, color: "#e05252", marginTop: 8 }}>{fieldErrors.consent}</p>}
                </div>

                {/* Back link */}
                <button type="button" onClick={() => setStep(1)} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, background: "none", border: "none", cursor: "pointer", color: "var(--hl-text-mute)", fontSize: 12, fontFamily: "var(--hl-font-ui)", padding: 0 }}>
                  <ChevronLeft size={14} /> Teslimat bilgilerine dön
                </button>
              </Panel>
            )}
          </div>

          {/* ── RIGHT: Summary ── */}
          <aside>
            <div style={{ ...panelStyle, position: "sticky", top: 20 }}>
              <h3 style={{ fontFamily: "var(--hl-font-display)", fontSize: 24, margin: "0 0 18px 0", fontWeight: 400 }}>Sipariş Özeti</h3>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                {items.map(item => (
                  <div key={item.productId + (item.variantId ?? "")} style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", gap: 10, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", background: "var(--hl-bg-elev-2)", position: "relative" }}>
                        {item.product.images?.[0] && (
                          <Image src={item.product.images[0].url} alt={item.product.images[0].alt} fill className="object-cover" sizes="52px" />
                        )}
                      </div>
                      <span style={{ position: "absolute", top: -5, right: -5, width: 17, height: 17, borderRadius: 999, background: "var(--hl-bronze-400)", color: "#1A1206", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center" }}>
                        {item.quantity}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hl-text)" }}>{item.product.name}</div>
                      <div style={{ fontSize: 10, color: "var(--hl-text-mute)", marginTop: 1 }}>{item.product.shortDescription}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-bronze-400)", whiteSpace: "nowrap" }}>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ marginBottom: 16 }}>
                {appliedCoupon ? (
                  <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(122,184,122,0.1)", border: "1px solid rgba(122,184,122,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Check size={12} color="#7ab87a" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#7ab87a" }}>{appliedCoupon.code} · −{formatPrice(appliedCoupon.discountAmount)}</span>
                    </div>
                    <button type="button" onClick={removeCoupon} style={{ background: "none", border: "none", cursor: "pointer", color: "#7ab87a", padding: 0 }}><X size={12} /></button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input ref={couponRef} type="text" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }} onKeyDown={e => e.key === "Enter" && handleApplyCoupon()} placeholder="Kupon kodu" style={{ flex: 1, padding: "9px 12px", background: "var(--hl-bg)", border: "1.5px solid var(--hl-line-strong)", borderRadius: 8, outline: "none", fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text)", letterSpacing: "0.05em" }} />
                      <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()} style={{ padding: "9px 13px", borderRadius: 8, background: "var(--hl-bg-elev-3)", border: "1.5px solid var(--hl-line-strong)", fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--hl-text-soft)", cursor: couponLoading || !couponInput.trim() ? "default" : "pointer", opacity: couponLoading || !couponInput.trim() ? 0.5 : 1 }}>
                        {couponLoading ? "…" : "UYGULA"}
                      </button>
                    </div>
                    {couponError && <p style={{ fontSize: 10, color: "#e05252", marginTop: 5 }}>{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, color: "var(--hl-text-mute)" }}>Ara toplam</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hl-text-soft)" }}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, color: "var(--hl-text-mute)" }}>Kargo</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: effectiveShipping === 0 ? "var(--hl-success)" : "var(--hl-text-soft)" }}>{effectiveShipping === 0 ? "Ücretsiz" : formatPrice(effectiveShipping)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, color: "var(--hl-text-mute)" }}>İndirim · {appliedCoupon?.code}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e05252" }}>−{formatPrice(couponDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="hl-rule-bronze" style={{ margin: "14px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--hl-text-soft)" }}>TOPLAM</span>
                <span style={{ fontSize: 26, fontWeight: 700, color: "var(--hl-bronze-400)", letterSpacing: "-0.02em", lineHeight: 1 }}>{formatPrice(total)}</span>
              </div>
              <p style={{ fontSize: 10, color: "var(--hl-text-mute)", textAlign: "right", marginBottom: 18 }}>KDV dahil</p>

              {submitError && (
                <div ref={submitErrorRef} style={{ padding: "9px 13px", borderRadius: 8, marginBottom: 12, scrollMarginTop: 90, background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)", fontSize: 12, color: "#e05252" }}>
                  {submitError}
                </div>
              )}

              {/* CTA */}
              {step === 1 ? (
                <button type="button" onClick={handleContinueToPayment} style={{ width: "100%", padding: "15px 0", borderRadius: 10, background: "var(--hl-bronze-400)", border: "none", color: "var(--hl-on-bronze)", fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", transition: "opacity 150ms ease" }}>
                  Ödemeye Devam Et →
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} aria-disabled={!consentChecked} style={{ width: "100%", padding: "15px 0", borderRadius: 10, background: !consentChecked || isSubmitting ? "var(--hl-bg-elev-3)" : "var(--hl-bronze-400)", border: "none", color: !consentChecked || isSubmitting ? "var(--hl-text-mute)" : "var(--hl-on-bronze)", fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer", transition: "all 150ms ease" }}>
                  {isSubmitting
                    ? "İşleniyor…"
                    : paymentMethod === "KREDI_KARTI"
                      ? `${formatPrice(total)} — Güvenli Ödemeye Geç →`
                      : `${formatPrice(total)} — Siparişi Tamamla`}
                </button>
              )}

              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7, fontSize: 11, color: "var(--hl-text-mute)" }}>
                <span style={{ display: "flex", gap: 7, alignItems: "center" }}><Shield size={11} /> PayTR ile güvenli ödeme · 3D Secure</span>
                <span style={{ display: "flex", gap: 7, alignItems: "center" }}><RotateCcw size={11} /> 14 gün içinde cayma hakkı</span>
                <span style={{ display: "flex", gap: 7, alignItems: "center" }}><Truck size={11} /> Aynı gün kargo · hızlı teslimat</span>
              </div>
            </div>
          </aside>
        </div>
      </form>

      <footer className="hl-checkout-footer" style={{ borderTop: "1px solid var(--hl-line)", padding: "14px 40px", display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--hl-text-mute)", fontFamily: "var(--hl-font-ui)" }}>
        <span>© {new Date().getFullYear()} Half Leaf · Yalnızca 18 yaş üstü için</span>
        <span style={{ display: "flex", gap: 16 }}>
          <Link href="/iletisim" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>İletişim</Link>
          <Link href="/yardim/sss" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>Yardım</Link>
          <Link href="/yasal/kvkk" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>KVKK</Link>
        </span>
      </footer>
    </div>
  );
}
