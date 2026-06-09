import type { Metadata } from "next";
import { headers } from "next/headers";
import AdminShell from "@/components/admin/layout/AdminShell";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Half Leaf Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
