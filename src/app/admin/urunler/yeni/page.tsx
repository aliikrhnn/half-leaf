import AdminHeader from "@/components/admin/layout/AdminHeader";
import ProductForm from "@/components/admin/ProductForm";

export default function YeniUrunPage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Yeni Ürün" subtitle="Kataloğa yeni ürün ekle" />
      <ProductForm />
    </div>
  );
}
