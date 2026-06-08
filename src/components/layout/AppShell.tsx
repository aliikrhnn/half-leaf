"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import SplashScreen from "@/components/brand/SplashScreen";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import type { NavCategory } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  navCategories?: NavCategory[];
}

export default function AppShell({ children, navCategories = [] }: Props) {
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);
  const isAdmin = pathname.startsWith("/admin");
  const isCheckout =
    pathname.startsWith("/odeme") || pathname.startsWith("/siparis-tamamlandi");
  const isAuth =
    pathname === "/giris" ||
    pathname === "/kayit" ||
    pathname === "/sifremi-unuttum";

  if (isAdmin || isCheckout || isAuth) {
    return <>{children}</>;
  }

  const showCurtain = pathname !== initialPathname;

  return (
    <>
      <AnnouncementBar />
      <SplashScreen />
      <Header navCategories={navCategories} />
      {showCurtain && (
        <div key={`hl-curt-${pathname}`} className="hl-leaf-curtain" aria-hidden="true">
          <div className="hl-lc-streak" />
          <div className="hl-lc-logo">
            <HalfLeafLogo full className="hl-lc-logo-img" />
          </div>
        </div>
      )}
      <main key={pathname} className="hl-page-enter">
        {children}
      </main>
      <Footer />
    </>
  );
}
