"use client";

import { AdminSidebarProvider, useAdminSidebar } from "./AdminSidebarContext";
import AdminSidebar from "./AdminSidebar";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useAdminSidebar();
  return (
    <div className="flex min-h-screen bg-bg">
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSidebarProvider>
      <ShellInner>{children}</ShellInner>
    </AdminSidebarProvider>
  );
}
