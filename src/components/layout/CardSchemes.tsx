/**
 * Kabul edilen kart şemaları — PayTR rozetinin yanında gösterilir.
 *
 * Logolar `public/payment/` altındaki SVG'lerden gelir. Visa ve troy
 * markaları şu an BASİTLEŞTİRİLMİŞ yer tutuculardır; resmî varlıkları
 * indirip aynı dosya adlarıyla değiştirmeniz yeterli (kodda değişiklik
 * gerekmez). Mastercard işareti resmî geometri ve renklerdedir.
 *
 * Açık/koyu temada da okunur kalsın diye her logo kendi açık zeminli
 * kutucuğunda durur.
 */

const SCHEMES = [
  { src: "/payment/visa.svg", alt: "Visa ile ödeme kabul edilir", w: 38 },
  { src: "/payment/mastercard.svg", alt: "Mastercard ile ödeme kabul edilir", w: 30 },
  { src: "/payment/troy.svg", alt: "troy ile ödeme kabul edilir", w: 34 },
] as const;

export default function CardSchemes({ height = 20 }: { height?: number }) {
  return (
    <span className="hl-cardschemes">
      {SCHEMES.map((s) => (
        <span key={s.src} className="hl-cardscheme" style={{ height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt={s.alt} width={s.w} height={height - 6} loading="lazy" />
        </span>
      ))}
    </span>
  );
}
