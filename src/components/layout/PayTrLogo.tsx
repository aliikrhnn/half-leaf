/**
 * PayTR rozeti — koyu temada beyaz, açık temada renkli logo.
 * Tema değişimi salt CSS ile yapılır (JS yok, hydration uyuşmazlığı yok).
 */
export default function PayTrLogo() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/payment/paytr-logo-white.svg"
        alt="PayTR ile güvenli ödeme"
        width={64}
        height={15}
        className="hl-paytr hl-paytr--dark"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/payment/paytr-logo-color.svg"
        alt=""
        aria-hidden="true"
        width={64}
        height={15}
        className="hl-paytr hl-paytr--light"
      />
    </>
  );
}
