import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export default function BestsellersSection({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section
      className="hl-page-shell"
      style={{ paddingBottom: "7.5rem" }}
    >
      <SectionHeading
        eyebrow="Çok Satanlar"
        title="En çok tercih edilenler"
        href="/urunler?cokSatanlar=1"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
