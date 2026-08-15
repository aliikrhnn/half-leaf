import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export default function NewArrivalsSection({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section
      className="hl-page-shell"
      style={{ paddingTop: "5rem", paddingBottom: "7.5rem" }}
    >
      <SectionHeading
        eyebrow="Yeni Gelenler"
        title="Yeni gelen ürünler"
        href="/urunler?siralama=yeni"
      />

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
