import { createContext, useContext, useState, useEffect } from "react";

const DARK = {
  bg:      "#080b12",
  surface: "#0e1118",
  card:    "#131720",
  card2:   "#181d28",
  border:  "#1d2438",
  border2: "#242d42",
  imp:     "#22d3ee",
  clk:     "#a78bfa",
  pur:     "#fb923c",
  vol:     "#34d399",
  green:   "#10b981",
  red:     "#f87171",
  muted:   "#374151",
  text:    "#e2e8f0",
  textDim: "#64748b",
  textSub: "#94a3b8",
  btnText: "#000",
  rowAlt:  "#ffffff03",
  hoverBg: "#22d3ee07",
};

const LIGHT = {
  bg:      "#f4f5f7",
  surface: "#ffffff",
  card:    "#ffffff",
  card2:   "#f8f9fb",
  border:  "#e2e5ea",
  border2: "#d1d5db",
  imp:     "#0891b2",
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
  hoverBg: "#0891b207",
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
