import { createContext, useContext, useState, useEffect } from "react";

const DARK = {
  bg:      "#0a0a0a",
  surface: "#111111",
  card:    "#161616",
  card2:   "#1a1a1a",
  border:  "#222222",
  border2: "#2a2a2a",
  imp:     "#dc2626",
  clk:     "#a78bfa",
  pur:     "#fb923c",
  vol:     "#34d399",
  green:   "#10b981",
  red:     "#f87171",
  muted:   "#374151",
  text:    "#e2e8f0",
  textDim: "#71717a",
  textSub: "#a1a1aa",
  btnText: "#fff",
  rowAlt:  "#ffffff03",
  hoverBg: "#dc262607",
};

const LIGHT = {
  bg:      "#f5f0e8",
  surface: "#faf6ef",
  card:    "#faf6ef",
  card2:   "#f0ebe3",
  border:  "#e0d6c8",
  border2: "#d1c7b8",
  imp:     "#b91c1c",
  clk:     "#7c3aed",
  pur:     "#ea580c",
  vol:     "#059669",
  green:   "#059669",
  red:     "#dc2626",
  muted:   "#9ca3af",
  text:    "#1e293b",
  textDim: "#64748b",
  textSub: "#475569",
  btnText: "#fff",
  rowAlt:  "#00000003",
  hoverBg: "#b91c1c07",
};

const ThemeCtx = createContext();

const STORAGE_KEY = "sqp_theme";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, [mode]);

  const toggle = () => setMode(m => m === "dark" ? "light" : "dark");
  const C = mode === "dark" ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={{ C, mode, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
