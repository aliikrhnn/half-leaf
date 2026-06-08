import type { Metadata } from "next";
import { headers } from "next/headers";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Half Leaf Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts (Next.js middleware) admin auth'u zaten doğrular ve x-pathname header'ını set eder.
  // Bu layout sadece login sayfasında sidebar'ı gizlemek için pathname'i okur.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
