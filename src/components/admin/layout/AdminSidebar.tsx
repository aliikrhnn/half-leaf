"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  LogOut,
  RefreshCw,
  ChevronLeft,
  FileText,
  Warehouse,
  MessageSquare,
  Layers,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import { useAdminSidebar } from "./AdminSidebarContext";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/stok", label: "Stok", icon: Warehouse },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: FolderOpen },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/kuponlar", label: "Kuponlar", icon: Tag },
  { href: "/admin/iade-talepleri", label: "İade Talepleri", icon: RefreshCw },
  { href: "/admin/yorumlar", label: "Yorumlar", icon: Star },
  { href: "/admin/icerik-sayfalari", label: "İçerik Sayfaları", icon: FileText },
  { href: "/admin/hero-slides",      label: "Hero Slide'lar",   icon: Layers },
  { href: "/admin/iletisim",         label: "İletişim",         icon: MessageSquare },
  { href: "/admin/ayarlar",          label: "Ayarlar",          icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useAdminSidebar();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-30 w-60 bg-bg-surface border-r border-border-default flex flex-col transition-transform duration-300",
      "lg:static lg:translate-x-0 lg:z-auto lg:min-h-screen",
      isOpen ? "translate-x-0" : "-translate-x-full",
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-border-default flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5" onClick={close}>
          <HalfLeafLogo full width={66} height={54} />
          <span className="block text-[10px] text-ink-dim uppercase tracking-wider">
            Admin Panel
          </span>
        </Link>
        <button
          className="lg:hidden p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-elevated transition-colors"
          onClick={close}
          aria-label="Menüyü kapat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Admin menü">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-accent/20 text-accent-light font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-bg-elevated"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border-default space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-bg-elevated transition-colors"
        >
          <ChevronLeft size={16} />
          Mağazaya Dön
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-red-400 hover:bg-bg-elevated transition-colors"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
