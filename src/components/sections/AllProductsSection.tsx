import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  /** Başlık verilirse bölüm başlığı çizilir; verilmezse kesintisiz devam (grid). */
  eyebrow?: string;
  title?: string;
  href?: string;
}

/**
 * "Tüm ürünler" grid'i. Ana sayfada yeni gelenlerin hemen altında tüm katalog
 * gösterilir; öne çıkanlar/atölyeden seçmeler bölümleri araya serpiştirilir.
 * Başlıksız çağrılan örnekler önceki bloğun kesintisiz devamı gibi görünür.
 */
export default function AllProductsSection({ products, eyebrow, title, href }: Props) {
  if (products.length === 0) return null;
  const hasHeader = Boolean(title);

  return (
    <section
      className="hl-page-shell"
      style={{ paddingTop: hasHeader ? "1rem" : 0, paddingBottom: "5.5rem" }}
    >
      {hasHeader && (
        <SectionHeading eyebrow={eyebrow} title={title!} href={href} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
