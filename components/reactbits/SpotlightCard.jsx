// components/reactbits/SpotlightCard.jsx
// A ReactBits-inspired SpotlightCard: a soft radial-gradient "spotlight"
// follows the cursor across the card on hover. Renders as whatever element
// you need (div, button, ...) via the `as` prop, so it can wrap clickable
// story/trip cards as well as plain display cards.
// Matching CSS lives in app/globals.css (.ecv-spotlight-card / .ecv-spotlight-glow).

"use client";

import { useRef } from "react";

export default function SpotlightCard({
  children,
  as: Tag = "div",
  className = "",
  spotlightColor = "rgba(31, 138, 90, 0.28)",
  ...rest
}) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`ecv-spotlight-card ${className}`}
      style={{ "--spot-color": spotlightColor }}
      {...rest}
    >
      <span className="ecv-spotlight-glow" aria-hidden="true" />
      {children}
    </Tag>
  );
}
