"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Package, X, Check, Lock, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { toast } from "@/store/toast";
import { useSiteFlags } from "@/components/layout/SiteFlags";
import { type StockNotice } from "@/lib/cart/reconcile";
import { useCartStockReconcile } from "@/hooks/useCartStockReconcile";
import StockNoticeBanner from "@/components/cart/StockNoticeBanner";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/constants";

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

/* ─── Step indicator ─── */
function StepIndicator({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { n: "01", label: "SEPET" },
    { n: "02", label: "TESLİMAT" },
    { n: "03", label: "ÖDEME" },
  ] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {steps.map((s, i) => {
        const isActive = i + 1 === active;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div style={{
                width: 48, height: 1,
                background: "var(--hl-line-strong)", margin: "0 8px",
              }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: isActive ? "var(--hl-bronze-400)" : "transparent",
                border: isActive ? "none" : "1.5px solid var(--hl-line-strong)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                  color: isActive ? "var(--hl-on-bronze)" : "var(--hl-text-mute)",
                  letterSpacing: "-0.01em",
                }}>
                  {s.n}
                </span>
              </div>
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em",
                color: isActive ? "var(--hl-text)" : "var(--hl-text-mute)",
              }}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Toggle switch ─── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: on ? "var(--hl-bronze-400)" : "var(--hl-line-strong)",
        position: "relative", cursor: "pointer", border: "none",
        transition: "background 200ms ease",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left 200ms ease",
        display: "block",
      }} />
    </button>
  );
}

/* ─── Qty stepper ─── */
function QtyStepper({ qty, max, onChange }: { qty: number; max: number; onChange: (n: number) => void }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: "1.5px solid var(--hl-line-strong)", borderRadius: "var(--hl-r-sm)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => onChange(Math.max(1, qty - 1))}
        style={{
          width: 34, height: 36, background: "none", border: "none",
          color: "var(--hl-text-soft)", cursor: "pointer",
          fontSize: 18, fontWeight: 300, lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Azalt"
      >−</button>
      <span style={{
        width: 32, textAlign: "center",
        fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 600,
        color: "var(--hl-text)",
      }}>
        {qty}
      </span>
      <button
        onClick={() => onChange(Math.min(max, qty + 1))}
        style={{
          width: 34, height: 36, background: "none", border: "none",
          color: "var(--hl-text-soft)", cursor: "pointer",
          fontSize: 18, fontWeight: 300, lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Artır"
      >+</button>
    </div>
  );
}

/* ─── Main component ─── */
export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [giftBox, setGiftBox] = useState(false);
  const [stockNotice, setStockNotice] = useState<StockNotice | null>(null);
  const couponRef = useRef<HTMLInputElement>(null);

  const { items, removeItem, updateQuantity, note, setNote } = useCartStore();
  const addToWishlist = useWishlistStore((s) => s.add);
  const { giftBoxEnabled } = useSiteFlags();

  /** Ürünü sepetten çıkarıp favorilere taşır. */
  const saveForLater = (item: (typeof items)[number]) => {
    addToWishlist({
      id: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      image: item.product.images?.[0]?.url ?? null,
      price: item.product.price,
    });
    removeItem(item.productId, item.variantId);
    toast("Favorilere taşındı", { label: "Favorilerim", href: "/favorilerim" });
  };

  useEffect(() => {
    useCartStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must run after SSR mount
    setMounted(true);
  }, []);

  // Hidrasyon bitince sepeti güncel stoğa göre düzelt (stoğu biten ürünleri
  // çıkar, adetleri kalan stoğa indir) ve değişiklik olursa bandı göster.
  useCartStockReconcile(setStockNotice);

  if (!mounted) {
    return (
      <div style={{
        minHeight: "100vh",
        padding: "calc(var(--hl-bar-h) + var(--hl-header-h) + 80px) 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)",
      }}>
        Yükleniyor…
      </div>
    );
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discount = appliedCoupon?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = items.length === 0 ? 0 : afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = afterDiscount + shipping;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/kupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json() as { discountAmount?: number; code?: string; error?: string };
      if (!res.ok || data.error) {
        setCouponError(data.error ?? "Kupon geçersiz.");
      } else {
        setAppliedCoupon({ code: data.code!, discountAmount: data.discountAmount! });
      }
    } catch {
      setCouponError("Bir hata oluştu. Tekrar deneyin.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setTimeout(() => couponRef.current?.focus(), 50);
  };

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="hl-page-shell" style={{
        paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 60px)",
        paddingBottom: 80,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", gap: 20,
      }}>
        {stockNotice && (
          <div style={{ width: "100%", maxWidth: 520, textAlign: "left" }}>
            <StockNoticeBanner notice={stockNotice} onDismiss={() => setStockNotice(null)} />
          </div>
        )}
        <ShoppingBag size={56} style={{ color: "var(--hl-text-mute)", marginBottom: 8 }} />
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)", margin: 0,
        }}>
          Sepetiniz henüz boş
        </h1>
        <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)", maxWidth: 360 }}>
          Özenle hazırlanmış koleksiyonumuzu keşfedin ve beğendiklerinizi sepetinize ekleyin.
        </p>
        <Link
          href="/urunler"
          style={{
            marginTop: 8, padding: "12px 32px", borderRadius: "var(--hl-r-pill)",
            background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
            fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
          }}
        >
          Koleksiyona Göz At
        </Link>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--hl-bg-elev-1)",
    border: "1px solid var(--hl-line-strong)",
    borderRadius: "var(--hl-r-lg)",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--hl-font-ui)", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "var(--hl-text-mute)",
  };

  return (
    <div className="hl-page-pad hl-page-shell" style={{
      paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 32px)",
      paddingBottom: 80,
    }}>
      {/* ── Stok bildirimi ── */}
      {stockNotice && (
        <div style={{ marginBottom: 24 }}>
          <StockNoticeBanner notice={stockNotice} onDismiss={() => setStockNotice(null)} />
        </div>
      )}

      {/* ── Top: label + title + steps ── */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ ...labelStyle, marginBottom: 10 }}>
            SEPET · {totalItems} ÜRÜN
          </p>
          <h1 style={{
            fontFamily: "var(--hl-font-display)", fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)",
            lineHeight: 1.05, margin: 0,
          }}>
            Sepetiniz
          </h1>
        </div>
        <div style={{ paddingTop: 8 }} className="hl-cart-steps">
          <StepIndicator active={1} />
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28, alignItems: "start" }} className="hl-cart-grid">

        {/* ────── LEFT: Product list ────── */}
        <div style={cardStyle}>
          {/* Table header */}
          <div className="hl-cart-table-header" style={{
            display: "grid", gridTemplateColumns: "1fr 120px 100px",
            padding: "14px 20px", borderBottom: "1px solid var(--hl-line)",
          }}>
            <span style={labelStyle}>ÜRÜN ({items.length})</span>
            <span style={{ ...labelStyle, textAlign: "center" }}>ADET</span>
            <span style={{ ...labelStyle, textAlign: "right" }}>TUTAR</span>
          </div>

          {/* Items */}
          {items.map((item, idx) => {
            const lineTotal = item.product.price * item.quantity;
            const lineStock = item.maxStock ?? item.product.stock;
            const maxQty = lineStock > 0 ? lineStock : 99;

            return (
              <div key={item.productId + (item.variantId ?? "")}>
                <div style={{
                  padding: "20px 20px 16px",
                  borderBottom: idx < items.length - 1 ? "1px solid var(--hl-line)" : "none",
                }}>
                  {/* Row: image + info / qty / price + remove */}
                  <div className="hl-cart-row" style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", alignItems: "center", gap: 12 }}>

                    {/* Image + name */}
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{
                        width: 72, height: 72, flexShrink: 0,
                        borderRadius: "var(--hl-r-sm)",
                        overflow: "hidden", background: "var(--hl-bg-elev-2)",
                        position: "relative",
                      }}>
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt}
                            fill
                            className="object-cover"
                            sizes="72px"
                          />
                        )}
                      </div>
                      <div>
                        <p style={{
                          fontFamily: "var(--hl-font-display)", fontSize: 16,
                          fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)",
                          lineHeight: 1.2, marginBottom: 4,
                        }}>
                          {item.product.name}
                        </p>
                        {item.variantLabel && (
                          <p style={{
                            fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
                            color: "var(--hl-bronze-400)", lineHeight: 1.4, marginBottom: 2,
                          }}>
                            Renk: {item.variantLabel}
                          </p>
                        )}
                        <p style={{
                          fontFamily: "var(--hl-font-ui)", fontSize: 11,
                          color: "var(--hl-text-mute)", lineHeight: 1.4,
                        }}>
                          {item.product.shortDescription}
                        </p>
                      </div>
                    </div>

                    {/* Qty stepper */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <QtyStepper
                        qty={item.quantity}
                        max={maxQty}
                        onChange={n => updateQuantity(item.productId, n, item.variantId)}
                      />
                    </div>

                    {/* Price + remove */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                      <span style={{
                        fontFamily: "var(--hl-font-ui)", fontSize: 15, fontWeight: 700,
                        color: "var(--hl-bronze-400)", whiteSpace: "nowrap",
                      }}>
                        {formatPrice(lineTotal)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "none", border: "1px solid var(--hl-line-strong)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "var(--hl-text-mute)", flexShrink: 0,
                          transition: "all 150ms ease",
                        }}
                        className="hl-cart-remove"
                        aria-label={`${item.product.name} kaldır`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Sub-actions
                      Not: "Hediye paketi ekle" satır-içi butonu kaldırıldı —
                      hiçbir şey yapmıyordu ve zaten aşağıdaki tek hediye
                      kutusu anahtarıyla çakışıyordu. "Daha sonra için kaydet"
                      ise artık gerçekten çalışıyor: ürünü sepetten çıkarıp
                      favorilere taşır. */}
                  <div className="hl-cart-sub-actions" style={{ marginTop: 10, paddingLeft: 86, display: "flex", gap: 16 }}>
                    <button
                      type="button"
                      className="hl-cart-saveforlater"
                      onClick={() => saveForLater(item)}
                    >
                      <Heart size={12} aria-hidden />
                      Daha sonra için kaydet
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Gift box toggle — admin'den açık/kapalı */}
          {giftBoxEnabled && (
          <div style={{
            margin: 16, borderRadius: "var(--hl-r-md)",
            background: "var(--hl-olive-800)", border: "1px solid var(--hl-line)",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "var(--hl-r-sm)",
              background: "var(--hl-olive-700)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Package size={18} style={{ color: "var(--hl-bronze-400)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700,
                color: "var(--hl-text)", marginBottom: 2,
              }}>
                Ahşap hediye kutusu ekle
              </p>
              <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 10, color: "var(--hl-text-mute)" }}>
                Ücretsiz · el yazısı kart ile
              </p>
            </div>
            <Toggle on={giftBox} onChange={() => setGiftBox(v => !v)} />
          </div>
          )}

          {/* Sipariş notu */}
          <div style={{ margin: 16, marginTop: 0 }}>
            <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>
              SİPARİŞ NOTU (OPSİYONEL)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Teslimat veya ürünle ilgili eklemek istediğiniz not (ör. zile basmadan arayın, hediye paketi…)"
              style={{
                width: "100%", background: "var(--hl-bg)", border: "1.5px solid var(--hl-line-strong)",
                borderRadius: "var(--hl-r-sm)", padding: "12px 14px", color: "var(--hl-text)",
                fontFamily: "var(--hl-font-ui)", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none",
              }}
            />
          </div>
        </div>

        {/* ────── RIGHT: Order summary ────── */}
        <div style={{
          ...cardStyle,
          padding: 24,
          position: "sticky",
          top: "calc(var(--hl-bar-h) + var(--hl-header-h) + 24px)",
        }}>
          <h2 style={{
            fontFamily: "var(--hl-font-display)", fontSize: 22,
            fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)",
            marginBottom: 20,
          }}>
            Sipariş Özeti
          </h2>

          {/* Coupon */}
          <div style={{ marginBottom: 20 }}>
            {appliedCoupon ? (
              <div style={{
                padding: "10px 14px", borderRadius: "var(--hl-r-sm)",
                background: "rgba(122,184,122,0.1)", border: "1px solid rgba(122,184,122,0.3)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={13} style={{ color: "#7ab87a", flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
                    color: "#7ab87a",
                  }}>
                    {appliedCoupon.code} uygulandı · {formatPrice(appliedCoupon.discountAmount)} indirim
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#7ab87a", padding: 0, lineHeight: 1,
                  }}
                  aria-label="Kuponu kaldır"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    ref={couponRef}
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Kupon kodu"
                    style={{
                      flex: 1, padding: "10px 14px",
                      background: "var(--hl-bg)", border: "1.5px solid var(--hl-line-strong)",
                      borderRadius: "var(--hl-r-sm)", outline: "none",
                      fontFamily: "var(--hl-font-ui)", fontSize: 12,
                      color: "var(--hl-text)", letterSpacing: "0.05em",
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    style={{
                      padding: "10px 16px", borderRadius: "var(--hl-r-sm)",
                      background: "var(--hl-bg-elev-3)",
                      border: "1.5px solid var(--hl-line-strong)",
                      fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", color: "var(--hl-text-soft)",
                      cursor: couponLoading || !couponInput.trim() ? "default" : "pointer",
                      opacity: couponLoading || !couponInput.trim() ? 0.5 : 1,
                      transition: "opacity 150ms ease", flexShrink: 0,
                    }}
                  >
                    {couponLoading ? "…" : "UYGULA"}
                  </button>
                </div>
                {couponError && (
                  <p style={{
                    fontFamily: "var(--hl-font-ui)", fontSize: 10,
                    color: "#e05252", marginTop: 6, letterSpacing: "0.02em",
                  }}>
                    {couponError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Summary rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
                Ara toplam
              </span>
              <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-soft)", fontWeight: 600 }}>
                {formatPrice(subtotal)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)", marginBottom: 2 }}>
                  Kargo
                </p>
                <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 9, color: "var(--hl-text-mute)", letterSpacing: "0.04em" }}>
                  {formatPrice(FREE_SHIPPING_THRESHOLD)} üzeri ücretsiz
                </p>
              </div>
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 600,
                color: shipping === 0 ? "#7ab87a" : "var(--hl-text-soft)",
              }}>
                {shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}
              </span>
            </div>

            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
                  İndirim · {appliedCoupon?.code}
                </span>
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 600, color: "#e05252" }}>
                  −{formatPrice(discount)}
                </span>
              </div>
            )}

            {giftBox && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
                  Hediye paketi
                </span>
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 600, color: "#7ab87a" }}>
                  Ücretsiz
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--hl-line-strong)", marginBottom: 16 }} />

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <span style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--hl-text-soft)",
            }}>
              TOPLAM
            </span>
            <span style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 26, fontWeight: 700,
              color: "var(--hl-bronze-400)", letterSpacing: "-0.02em", lineHeight: 1,
            }}>
              {formatPrice(total)}
            </span>
          </div>
          <p style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 10,
            color: "var(--hl-text-mute)", textAlign: "right", marginBottom: 20,
          }}>
            KDV dahil
          </p>

          {/* CTA */}
          <Link
            href="/odeme"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "15px 0", borderRadius: "var(--hl-r-md)",
              background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
              fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
              transition: "opacity 150ms ease",
            }}
            className="hl-checkout-btn"
          >
            ÖDEMEYE GEÇ →
          </Link>

          {/* Secure payment note */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
            <Lock size={11} style={{ color: "var(--hl-text-mute)" }} />
            <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 10, color: "var(--hl-text-mute)" }}>
              Güvenli ödeme
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
