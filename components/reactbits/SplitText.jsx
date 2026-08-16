// components/reactbits/SplitText.jsx
// A ReactBits-inspired SplitText: splits text into characters or words and
// reveals them with a staggered fade + rise as soon as the element enters
// the viewport. Re-implemented from scratch (no gsap/motion dependency) so
// it stays lightweight — same prop shape as the ReactBits original
// (text, splitType, delay, duration, from) so it's a drop-in replacement
// if this project ever adds gsap later.

"use client";

import { useEffect, useRef, useState } from "react";

export default function SplitText({
  text = "",
  as: Tag = "span",
  className = "",
  splitType = "chars", // "chars" | "words"
  delay = 30, // ms stagger between each unit
  duration = 550, // ms per-unit transition
  from = { opacity: 0, y: 18 },
  triggerOnce = true,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (triggerOnce) io.disconnect();
        } else if (!triggerOnce) {
          setVisible(false);
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [triggerOnce, text]);

  const units = splitType === "words" ? text.split(" ") : Array.from(text);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {units.map((unit, i) => (
        <span
          key={`${unit}-${i}`}
          aria-hidden="true"
          style={{
            display: "inline-block",
            willChange: "transform, opacity",
            transform: visible ? "translateY(0)" : `translateY(${from.y ?? 18}px)`,
            opacity: visible ? 1 : from.opacity ?? 0,
            transition: `transform ${duration}ms cubic-bezier(0.22,1,0.36,1), opacity ${duration}ms ease`,
            transitionDelay: `${i * delay}ms`,
          }}
        >
          {unit === " " ? "\u00A0" : unit}
          {splitType === "words" && i < units.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
