"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import SplashScreen from "@/components/brand/SplashScreen";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import LeafMark from "@/components/brand/LeafMark";
import Toaster from "@/components/ui/Toaster";
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
      <AnnouncementBar messages={announcementMessages} />
      <SplashScreen />
      <Header navCategories={navCategories} />
      {showCurtain && (
        <div key={`hl-nav-${pathname}`} className="hl-nav-pip" aria-hidden="true">
          <LeafMark width={26} height={52} className="hl-nav-leaf" />
        </div>
      )}
      <main key={pathname} className="hl-page-enter">
        {children}
      </main>
      {footer}
      <Toaster />
    </>
  );
}
