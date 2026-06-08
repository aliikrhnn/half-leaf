import Link from "next/link";
import ImgSlot from "@/components/ui/ImgSlot";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
}

const SHOT_LABELS: Record<string, string> = {
  takimlar: "tam takım, lateral",
  hortumlar: "deri hortum kıvrımı",
  tablalar: "pirinç tabla yakın çekim",
  aksesuarlar: "küçük aksesuar grubu",
};

export default function CategoryGrid({ categories }: Props) {
  if (categories.length === 0) return null;

  return (
    <section
      className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
      style={{ paddingBottom: "6.25rem" }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {categories.slice(0, 4).map((cat) => (
          <Link
            key={cat.id}
            href={`/urunler?kategori=${cat.slug}`}
            className="group relative block overflow-hidden"
            style={{
              aspectRatio: "4/5",
              borderRadius: "var(--hl-r-md)",
              background: "var(--hl-bg-elev-1)",
              border: "1px solid var(--hl-line)",
            }}
          >
            <ImgSlot
              label={SHOT_LABELS[cat.slug] ?? cat.name}
              className="absolute inset-0"
            />

            {/* Gradient overlay */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 45%, rgba(10,11,9,0.88) 100%)",
                transition: "opacity 300ms",
              }}
            />

            {/* Text */}
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 20,
              }}
            >
              <div
                className="hl-display"
                style={{
                  fontSize: "clamp(20px, 2.5vw, 28px)",
                  color: "var(--hl-text)",
                }}
              >
                {cat.name}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--hl-text-soft)",
                    fontFamily: "var(--hl-font-ui)",
                  }}
                >
                  {cat.productCount} ürün
                </span>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--hl-bronze-300)"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <path d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
