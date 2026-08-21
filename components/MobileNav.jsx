// components/MobileNav.jsx
// Site-wide MOBILE-ONLY nav — the Next.js counterpart to
// public/legacy/js/mobile-dock.js. Below 640px (Tailwind `sm`) this is the
// only navigation shown; Navbar.jsx takes over at sm+ (see its `hidden
// sm:flex`). Icons magnify as a finger drags near them, matching the
// ReactBits Dock concept — same physics as the legacy site's vanilla-JS
// version, reimplemented here in React for consistency across both stacks.

"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Cloud, User, MessageCircle } from "lucide-react";

// Task 9 spec: Home | AI Planner | Weather | My Account | Ask AI. Weather and
// Ask AI live only on the legacy static site's widgets — from a Next.js page
// there's nothing local to trigger, so these always hop over with a hash
// that auto-opens the widget once index.html loads (see weather.js/main.js).
const ITEMS = [
  { href: "/legacy/index.html", label: "Home", icon: Home },
  { href: "/legacy/index.html#planner", label: "AI Planner", icon: Sparkles },
  { href: "/legacy/index.html#openWeather", label: "Weather", icon: Cloud },
  { href: "/my-account", label: "Account", icon: User },
  { href: "/legacy/index.html#openAskAI", label: "Ask AI", icon: MessageCircle },
];

const MAX_SCALE = 1.35;
const FALLOFF = 70; // px

export default function MobileNav() {
  const pathname = usePathname();
  const itemRefs = useRef([]);

  const applyMagnify = (clientX) => {
    itemRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - center);
      const scale = dist > FALLOFF ? 1 : 1 + (MAX_SCALE - 1) * (1 - dist / FALLOFF);
      el.style.transform = `translateY(${scale > 1 ? -(scale - 1) * 18 : 0}px) scale(${scale})`;
    });
  };

  const reset = () => {
    itemRefs.current.forEach((el) => {
      if (el) el.style.transform = "";
    });
  };

  return (
    <nav
      onTouchMove={(e) => applyMagnify(e.touches[0].clientX)}
      onTouchEnd={reset}
      onTouchCancel={reset}
      onMouseMove={(e) => applyMagnify(e.clientX)}
      onMouseLeave={reset}
      className="
        sm:hidden
        fixed bottom-2.5 left-1/2 -translate-x-1/2 z-50
        w-[calc(100%-20px)] max-w-sm
        bg-white/85 backdrop-blur-xl
        border border-white/60
        rounded-3xl
        shadow-[0_16px_40px_-12px_rgba(18,38,30,0.28)]
        px-1.5 py-2
        flex items-end justify-between
      "
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Mobile navigation"
    >
      {ITEMS.map(({ href, label, icon: Icon }, i) => {
        const active = pathname === href || (href.startsWith("/legacy") && pathname === "/legacy/index.html" && label === "Home");
        return (
          <Link
            key={href}
            href={href}
            ref={(el) => (itemRefs.current[i] = el)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition-colors will-change-transform"
            style={{ transformOrigin: "bottom center" }}
            aria-label={label}
          >
            <Icon
              className={`w-[22px] h-[22px] ${active ? "text-emerald-700" : "text-emerald-900/60"}`}
              strokeWidth={active ? 2.4 : 1.9}
            />
            <span
              className={`text-[9.5px] font-semibold ${active ? "text-emerald-700" : "text-emerald-900/50"}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
