import AdminHeader from "@/components/admin/layout/AdminHeader";
import CategoryForm from "@/components/admin/CategoryForm";

export default function YeniKategoriPage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Yeni Kategori" subtitle="Katalog kategorisi ekle" />
      <CategoryForm />
    </div>
  );
}
