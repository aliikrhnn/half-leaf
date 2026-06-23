"use client";

import { createContext, useContext } from "react";

export interface SiteFlags {
  giftBoxEnabled: boolean;
  whatsappNumber: string | null;
}

const SiteFlagsContext = createContext<SiteFlags>({ giftBoxEnabled: true, whatsappNumber: null });

export function SiteFlagsProvider({ flags, children }: { flags: SiteFlags; children: React.ReactNode }) {
  return <SiteFlagsContext.Provider value={flags}>{children}</SiteFlagsContext.Provider>;
}

export function useSiteFlags(): SiteFlags {
  return useContext(SiteFlagsContext);
}
