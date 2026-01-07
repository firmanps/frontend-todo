"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCsrfToken } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      // Dapatkan CSRF token terlebih dahulu
      const csrfToken = await getCsrfToken();

      // Hit logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Sertakan CSRF token jika ada
        },
      });

      if (response.ok) {
        // Logout sukses, redirect ke auth page
        router.replace("/auth");
        onClose?.();
      } else {
        // Jika logout gagal, tetap redirect ke auth page
        console.error("Logout failed:", await response.json());
        router.replace("/auth");
        onClose?.();
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Jika error, tetap redirect ke auth page
      router.replace("/auth");
      onClose?.();
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onToggle}
        aria-hidden
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col border-r border-border bg-card transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Image
              src="/icon2.png"
              width={2000}
              height={2000}
              alt="icons"
              className="w-8 h-8 rounded-lg"
              priority
            />
            <span className="text-xl font-bold text-foreground">TaskFlow</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/");

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Info & Logout (PASTI DI BAWAH) */}
        <div className="mt-auto border-t border-border p-3 space-y-2">
          {/* User Info */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-secondary/50">
              {user.profile?.image ? (
                <Image
                  src={user.profile.image}
                  width={40}
                  height={40}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>
    </>
  );
}

/* Trigger button – tampil di semua ukuran */
export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label="Open sidebar"
      className="shrink-0"
    >
      <Menu className="h-8 w-8" />
    </Button>
  );
}
