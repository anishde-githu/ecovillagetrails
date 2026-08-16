// components/reactbits/Dock.jsx
// A ReactBits-inspired Dock: icons magnify continuously based on cursor
// distance, macOS-style. Desktop-only by design (hidden below the `sm`
// breakpoint) — on phones, the site-wide MobileNav/mobile-dock.js already
// covers every page including My Account, so this doesn't duplicate it
// there. Rendered only inside MyAccount.jsx, per spec: on desktop this
// magnifying dock appears nowhere else on the site.

"use client";

import { useRef } from "react";

const MAX_SCALE = 1.6;
const FALLOFF = 90; // px

export default function Dock({ items = [], className = "" }) {
  const itemRefs = useRef([]);

  const applyMagnify = (clientX) => {
    itemRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - center);
      const scale = dist > FALLOFF ? 1 : 1 + (MAX_SCALE - 1) * (1 - dist / FALLOFF);
      el.style.transform = `translateY(${scale > 1 ? -(scale - 1) * 22 : 0}px) scale(${scale})`;
    });
  };

  const reset = () => {
    itemRefs.current.forEach((el) => {
      if (el) el.style.transform = "";
    });
  };

  return (
    <div
      onMouseMove={(e) => applyMagnify(e.clientX)}
      onMouseLeave={reset}
      className={`hidden sm:flex items-end gap-1.5 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl px-3 py-2.5 shadow-[0_16px_40px_-12px_rgba(18,38,30,0.28)] w-fit ${className}`}
    >
      {items.map((item, i) => (
        <button
          key={item.key || i}
          type="button"
          onClick={item.onClick}
          ref={(el) => (itemRefs.current[i] = el)}
          title={item.label}
          className="relative flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group will-change-transform"
          style={{ transformOrigin: "bottom center" }}
        >
          {item.icon}
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
