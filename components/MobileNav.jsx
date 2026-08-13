// components/MobileNav.jsx
// Floating glassmorphism bottom nav, mobile-only (hidden md+).
// Highlights the active route.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, CalendarClock, User } from "lucide-react";

const ITEMS = [
  { href: "/legacy/index.html", label: "Home", icon: Home },
  { href: "/legacy/index.html#destinations", label: "Explore", icon: Compass },
  { href: "/legacy/index.html#planner", label: "Plan", icon: CalendarClock },
  { href: "/my-account", label: "Account", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        md:hidden
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        w-[90%] max-w-sm
        bg-white/10 backdrop-blur-xl
        border border-white/20
        rounded-2xl
        shadow-lg
        px-2 py-2
        flex items-center justify-between
      "
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-colors"
            aria-label={label}
          >
            <Icon
              className={`w-5 h-5 ${active ? "text-emerald-500" : "text-white/80"}`}
              strokeWidth={active ? 2.5 : 2}
            />
            <span
              className={`text-[10px] mt-1 ${
                active ? "text-emerald-500 font-medium" : "text-white/70"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
