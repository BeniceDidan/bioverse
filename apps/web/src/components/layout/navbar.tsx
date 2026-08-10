"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Home,
  BookOpen,
  Microscope,
  Bot,
  ListChecks,
  Video,
  LayoutDashboard,
  Info,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationMenu } from "./notification-menu";
import { BioVerseLogo } from "./bioverse-logo";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

const MAIN_LINKS = [
  // The logo also links home, but it reads as branding rather than a control,
  // so returning to the landing page needs an item people can actually find.
  { href: "/", label: "Beranda", icon: Home },
  {
    href: "/materi",
    label: "Materi",
    icon: BookOpen,
    teacher: { href: "/upload-materi", label: "Tambah Materi" },
  },
  {
    href: "/virtual-microscope",
    label: "Microscope",
    icon: Microscope,
    teacher: { href: "/kelola-mikroskop", label: "Kelola Preparat" },
  },
  { href: "/ai-tutor", label: "AI Tutor", icon: Bot },
  {
    href: "/kuis",
    label: "Kuis",
    icon: ListChecks,
    teacher: { href: "/kelola-kuis", label: "Kelola Kuis" },
  },
  {
    href: "/video",
    label: "Video",
    icon: Video,
    teacher: { href: "/kelola-video", label: "Kelola Video" },
  },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tentang", label: "Tentang", icon: Info },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, status, clearSession } = useAuthStore();

  async function handleLogout() {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      clearSession();
      router.push("/");
    }
  }

  const links = MAIN_LINKS;
  const isTeacher = user?.role === "TEACHER";

  return (
    <header className="sticky top-0 z-40 w-full glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-lg font-bold text-foreground">
          <BioVerseLogo className="size-9" />
          <span className="hidden sm:inline">BioVerse</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || (link.teacher && pathname.startsWith(link.teacher.href));

            if (isTeacher && link.teacher) {
              return (
                <DropdownMenu key={link.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <link.icon className="size-4" />
                      {link.label}
                      <ChevronDown className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem asChild>
                      <Link href={link.href}>Lihat {link.label}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={link.teacher.href}>{link.teacher.label}</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <NotificationMenu />
          <ThemeToggle />

          {status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar>
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profil">
                    <UserIcon /> Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
                  <LogOut /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Daftar</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="overflow-hidden lg:hidden"
            aria-label="Buka menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
                transition={{ duration: 0.25, ease: APPLE_EASE }}
                className="flex"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="overflow-hidden border-t border-border bg-card lg:hidden"
          >
            <div className="px-4 pb-4 pt-3">
              <nav className="grid grid-cols-2 gap-2">
                {[
                  ...links.flatMap((l) =>
                    isTeacher && l.teacher
                      ? [
                          { href: l.href, label: l.label, icon: l.icon },
                          { href: l.teacher.href, label: l.teacher.label, icon: undefined },
                        ]
                      : [{ href: l.href, label: l.label, icon: l.icon }]
                  ),
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium",
                      pathname === link.href ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {link.icon ? <link.icon className="size-4" /> : null}
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/profil"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-muted px-3 py-3 text-sm font-medium text-foreground"
                >
                  <UserIcon className="size-4" /> Profil
                </Link>
              </nav>
              {status !== "authenticated" && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/login">Masuk</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/register">Daftar</Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
