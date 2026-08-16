// components/reactbits/GradientText.jsx
// A ReactBits-inspired GradientText: an animated gradient sweeps across the
// text continuously. Pure CSS (background-clip: text + a moving
// background-position), no dependency. Matching keyframes/utility class
// live in app/globals.css (.ecv-gradient-text / @keyframes ecv-gradient-move).

export default function GradientText({
  children,
  as: Tag = "span",
  className = "",
  colors = ["#0f5c3d", "#1f8a5a", "#7bc97e", "#1f8a5a", "#0f5c3d"],
  animationSpeed = 6,
}) {
  return (
    <Tag
      className={`ecv-gradient-text ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "300% 100%",
        animationDuration: `${animationSpeed}s`,
      }}
    >
      {children}
    </Tag>
  );
}
