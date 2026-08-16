"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import SplashScreen from "@/components/brand/SplashScreen";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import LeafMark from "@/components/brand/LeafMark";
import Toaster from "@/components/ui/Toaster";
import RegisterPrompt from "./RegisterPrompt";
import WhatsAppFloat from "./WhatsAppFloat";
import CartSync from "./CartSync";
import StockReconciler from "./StockReconciler";
import type { NavCategory } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  footer: React.ReactNode;
  navCategories?: NavCategory[];
  announcementMessages?: string[];
}

export default function AppShell({ children, footer, navCategories = [], announcementMessages }: Props) {
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);

  /*
   * Sayfa değişince en üste dön.
   *
   * `html { scroll-behavior: smooth }` açık olduğu için tarayıcı, yeni sayfaya
   * geçerken eski kaydırma konumundan yumuşak biçimde yukarı süzülüyordu; uzun
   * bir sayfadan kısa bir sayfaya geçildiğinde kullanıcı kendini footer'ın
   * yanında buluyordu. "instant" ile geçiş anında ve tek seferde en üste alınır.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  const isAdmin = pathname.startsWith("/admin");
  const isCheckout =
    pathname.startsWith("/odeme") || pathname.startsWith("/siparis-tamamlandi");
  // Bu sayfalar kendi kabuklarını (AuthShell) taşır — site header/footer'ı almazlar.
  const isAuth =
    pathname === "/giris" ||
    pathname === "/kayit" ||
    pathname === "/sifremi-unuttum" ||
    pathname === "/sifre-sifirla";

  if (isAdmin || isCheckout || isAuth) {
    return <>{children}</>;
  }

  const showCurtain = pathname !== initialPathname;

  return (
    <>
      <AnnouncementBar messages={announcementMessages} />
      <SplashScreen />
      <Header navCategories={navCategories} />
      {showCurtain && (
        <div key={`hl-nav-${pathname}`} className="hl-nav-veil" aria-hidden="true">
          <span className="hl-nav-veil-badge">
            <span className="hl-nav-veil-ring" />
            <LeafMark width={26} height={52} className="hl-nav-veil-leaf" />
          </span>
        </div>
      )}
      <main key={pathname} className="hl-page-enter">
        {children}
      </main>
      {footer}
      <Toaster />
      <RegisterPrompt />
      <WhatsAppFloat />
      <CartSync />
      <StockReconciler />
    </>
  );
}
