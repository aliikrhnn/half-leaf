"use client";

import { Bell, Menu } from "lucide-react";
import { useAdminSidebar } from "./AdminSidebarContext";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const { open } = useAdminSidebar();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-6 py-4 bg-bg-surface/95 backdrop-blur-sm border-b border-border-default">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
          onClick={open}
          aria-label="Menüyü aç"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button
          className="p-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated relative"
          aria-label="Bildirimler"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
