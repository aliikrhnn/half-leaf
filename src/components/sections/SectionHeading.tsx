import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  eyebrow?: string;
  title: string;
  /** "Tümünü gör" bağlantısı. */
  href?: string;
  linkLabel?: string;
  /** Bağlantı yerine özel bir aksiyon (ör. filtre sekmeleri). */
  action?: React.ReactNode;
  /** Başlığın altındaki bronz saç teli. */
  rule?: boolean;
}

/**
 * Ana sayfa bölüm başlığı — tek kaynak.
 *
 * Önceden beş bölüm beş farklı ağırlık/ölçek/ayraç kombinasyonu kullanıyordu
 * (400 vs 600 ağırlık, -0.02 vs -0.03 harf aralığı, kimi bölümde ayraç çizgisi
 * var kimide yok, "Tümünü gör" linkinin kimi hover'lı kimi ölü). Hepsi burada
 * birleşti.
 */
export default function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "Tümünü gör",
  action,
  rule = true,
}: Props) {
  return (
    <>
      <div className="hl-section-head">
        <div>
          {eyebrow && <div className="hl-eyebrow">{eyebrow}</div>}
          <h2 className="hl-section-title">{title}</h2>
        </div>

        {action ?? (href && (
          <Link href={href} className="hl-section-link">
            {linkLabel}
            <ArrowRight size={15} aria-hidden />
          </Link>
        ))}
      </div>

      {rule && <div className="hl-rule-bronze hl-section-rule" />}
    </>
  );
}
