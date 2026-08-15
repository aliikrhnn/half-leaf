import Link from "next/link";
import { ArrowRight } from "lucide-react";

/*
 * Rehber kartları.
 *
 * Önceden her kartın üstünde 280px'lik boş bir görsel yuvası vardı; hiçbir
 * kartın görseli olmadığı için ana sayfanın altında yan yana üç boş dokulu
 * kutu duruyordu. Görsel yuvası kaldırıldı, yerine tipografik/editoryal bir
 * düzen kondu: dev hayalet numara + bronz saç teli + hover'da yükselen kart.
 */
const CARDS = [
  {
    index: "01",
    label: "Rehber",
    title: "Nargile seçim rehberi",
    desc: "İlk kez mi alıyorsunuz? Model, boyut ve malzeme farkları — bilmeniz gereken her şey.",
    href: "/yardim/secim-rehberi",
    cta: "Devamını oku",
  },
  {
    index: "02",
    label: "Bakım",
    title: "Bakım & temizlik",
    desc: "Boru, lüle ve şişe temizliği için adım adım bakım rehberi. Uzun ömür için doğru teknikler.",
    href: "/yardim/bakim-temizlik",
    cta: "Devamını oku",
  },
  {
    index: "03",
    label: "Koleksiyon",
    title: "Öne çıkan koleksiyon",
    desc: "Editör seçkisi parçalar, özel seriler ve koleksiyonluk modeller.",
    href: "/urunler?oneCikan=1",
    cta: "Koleksiyonu gör",
  },
];

export default function ContentCards() {
  return (
    <section className="hl-page-shell" style={{ paddingBottom: "7.5rem" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
        {CARDS.map((card) => (
          <Link key={card.title} href={card.href} className="hl-content-card">
            <span className="hl-content-card-index" aria-hidden>
              {card.index}
            </span>

            <span className="hl-content-card-label">{card.label}</span>
            <span className="hl-content-card-title">{card.title}</span>
            <span className="hl-content-card-rule" aria-hidden />
            <span className="hl-content-card-desc">{card.desc}</span>

            <span className="hl-content-card-cta">
              {card.cta}
              <ArrowRight size={14} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
