import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
  const { C, mode, toggle } = useTheme();
  const Icon = mode === "dark" ? Sun : Moon;
  return (
    <div
      onClick={toggle}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 34, height: 34, borderRadius: 9,
        background: C.card, border: "1px solid " + C.border,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "border-color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.imp}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <Icon size={15} style={{ color: C.textDim }} />
    </div>
  );
}
