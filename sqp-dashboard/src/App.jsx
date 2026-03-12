import { useState, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, ComposedChart
} from "recharts";
import {
  Upload, X, ChevronUp, ChevronDown, Search, Eye,
  MousePointer, ShoppingCart, BarChart2, Minus, ChevronRight, Layers
} from "lucide-react";

/* ─── Theme ─────────────────────────────────────────────────────── */
const C = {
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
};

const KPI_DEFS = [
  { id: "imp", label: "Impression Share", field: "Impressions: Brand Share %",  countField: "Impressions: Brand Count", totalField: "Impressions: Total Count", color: C.imp, icon: Eye,          unit: "%" },
  { id: "clk", label: "Click Share",      field: "Clicks: Brand Share %",       countField: "Clicks: Brand Count",      totalField: "Clicks: Total Count",      color: C.clk, icon: MousePointer, unit: "%" },
  { id: "pur", label: "Purchase Share",   field: "Purchases: Brand Share %",    countField: "Purchases: Brand Count",   totalField: "Purchases: Total Count",   color: C.pur, icon: ShoppingCart, unit: "%" },
  { id: "vol", label: "Search Volume",    field: "Search Query Volume",         countField: "Search Query Volume",      totalField: null,                       color: C.vol, icon: BarChart2,    unit: ""  },
];

/* ─── CSV Parser ─────────────────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.split("\n");
  const headerLine = lines.find(l => l.startsWith('"Search Query"'));
  if (!headerLine) return null;
  const headerIdx = lines.indexOf(headerLine);
  const meta = lines[0];
  // e.g. Select week=["Week 9 | 2026-02-22 - 2026-02-28 2026"]
  const m = meta.match(/Select week=\["(Week \d+) \| ([\d-]+) - ([\d-]+)/);
  if (!m) return null;

  const weekLabel = m[1];                                     // "Week 9"
  const weekNum   = parseInt(weekLabel.replace("Week ", ""), 10); // 9
  const dateEnd   = m[3];                                     // "2026-02-28"
  const weekYear  = parseInt(dateEnd.split("-")[0], 10);      // 2026

  // KEY FIX: use real calendar timestamp for sorting
  // This ensures Week 50/2025 (sortKey=Dec 2025) < Week 1/2026 (sortKey=Jan 2026)
  const sortKey   = new Date(dateEnd).getTime();

  // Short label for charts/pills: "W9 '26"
  const weekShort = "W" + weekNum + " '" + String(weekYear).slice(2);

  const headers = headerLine.split(",").map(h => h.replace(/"/g, "").trim());
  const rows = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { cols.push(cur); cur = ""; }
      else cur += ch;
    }
    cols.push(cur);
    const obj = {
      _week:     weekShort,
      _weekFull: weekLabel,
      _weekNum:  weekNum,
      _weekYear: weekYear,
      _weekDate: dateEnd,
      _sortKey:  sortKey,
    };
    headers.forEach((h, ii) => { obj[h] = (cols[ii] || "").replace(/"/g, "").trim(); });
    if (obj["Search Query"]) rows.push(obj);
  }

  return { weekLabel, weekShort, weekNum, weekYear, weekDate: dateEnd, sortKey, rows };
}

/* ─── Helpers ────────────────────────────────────────────────────── */
const pct  = v => { const n = parseFloat(v);  return isNaN(n) ? 0 : n; };
const num  = v => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
const fmtP = v => (v == null ? "–" : Number(v).toFixed(1) + "%");
const fmtN = v => (v == null ? "–" : Number(v).toLocaleString());

/* ─── Tiny Sparkline (pure SVG) ─────────────────────────────────── */
function Spark({ data, color, width = 80, height = 30 }) {
  const clean = (data || []).map(v => (isNaN(v) ? 0 : v));
  if (clean.filter(Boolean).length < 2) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.muted, fontSize: 9 }}>no data</span>
      </div>
    );
  }
  const max = Math.max(...clean), min = Math.min(...clean);
  const range = max - min || 1;
  const pad = 3, W = width, H = height;
  const xs = clean.map((_, i) => pad + (i / (clean.length - 1)) * (W - pad * 2));
  const ys = clean.map(v => H - pad - ((v - min) / range) * (H - pad * 2));
  const linePoints = xs.map((x, i) => x + "," + ys[i]).join(" ");
  const fillPoints = xs[0] + "," + H + " " + linePoints + " " + xs[xs.length - 1] + "," + H;
  const last = clean[clean.length - 1], prev = clean[clean.length - 2];
  const dotColor = last >= prev ? C.green : C.red;
  const gradId = "sg" + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={"url(#" + gradId + ")"} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={dotColor} />
    </svg>
  );
}

/* ─── Delta Badge ────────────────────────────────────────────────── */
function Badge({ value, unit, small }) {
  if (value === null || value === undefined) return <span style={{ color: C.muted, fontSize: small ? 10 : 11 }}>–</span>;
  const isPct = unit === "%";
  const threshold = isPct ? 0.05 : 0;
  const up = value > threshold, dn = value < -threshold;
  const col = up ? C.green : dn ? C.red : C.textDim;
  const Icon = up ? ChevronUp : dn ? ChevronDown : Minus;
  const abs = Math.abs(value);
  const disp = isPct
    ? abs.toFixed(1) + "pp"
    : abs >= 1000 ? fmtN(Math.round(abs)) : abs.toFixed(0);
  return (
    <span style={{ color: col, fontSize: small ? 10 : 11, display: "inline-flex", alignItems: "center", gap: 1, fontFamily: "monospace" }}>
      <Icon size={small ? 10 : 11} />
      {up ? "+" : dn ? "-" : ""}{disp}
    </span>
  );
}

/* ─── KPI Summary Card ───────────────────────────────────────────── */
function KpiCard({ kpi, trendData, latestVal, prevVal }) {
  const d = (latestVal !== null && prevVal !== null) ? latestVal - prevVal : null;
  const sparkVals = trendData.map(w => w[kpi.id]);
  const Icon = kpi.icon;
  const display = kpi.unit === "%" ? fmtP(latestVal) : fmtN(latestVal);
  return (
    <div style={{
      background: C.card, border: "1px solid " + C.border, borderRadius: 14,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: kpi.color, opacity: 0.75, borderRadius: "14px 14px 0 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
            {latestVal !== null ? display : "–"}
          </div>
          <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
            <Badge value={d} unit={kpi.unit === "%" ? "%" : "n"} />
            {prevVal !== null && <span style={{ color: C.textDim, fontSize: 10 }}>WoW</span>}
          </div>
        </div>
        <div style={{ background: kpi.color + "18", borderRadius: 10, padding: 10 }}>
          <Icon size={20} style={{ color: kpi.color }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <Spark data={sparkVals} color={kpi.color} width={130} height={40} />
        <div style={{ fontSize: 10, color: C.textDim, paddingBottom: 4 }}>{trendData.length}w trend</div>
      </div>
    </div>
  );
}

/* ─── Expanded Keyword Panel ─────────────────────────────────────── */
function ExpandedRow({ keyword, allWeeks }) {
  // Build week rows in chronological order (allWeeks already sorted by sortKey)
  const weekRows = allWeeks.map(w => {
    const r = w.rows.find(r => r["Search Query"] === keyword);
    return r ? { ...r } : { _week: w.weekShort, _weekFull: w.weekLabel, "Search Query": keyword };
  });

  const chartData = weekRows.map(r => ({
    week:        r._week,
    "Imp Share": pct(r["Impressions: Brand Share %"]),
    "Clk Share": pct(r["Clicks: Brand Share %"]),
    "Pur Share": pct(r["Purchases: Brand Share %"]),
    "SQ Volume": num(r["Search Query Volume"]),
    "Imp #":     num(r["Impressions: Brand Count"]),
    "Clk #":     num(r["Clicks: Brand Count"]),
    "Pur #":     num(r["Purchases: Brand Count"]),
  }));

  const [tab, setTab] = useState("share");
  const TABS = [
    { id: "share",  label: "Brand Share %" },
    { id: "vol",    label: "Search Volume" },
    { id: "counts", label: "Brand Counts"  },
  ];

  return (
    <div style={{
      background: C.card2,
      borderBottom: "2px solid " + C.border,
      borderLeft: "2px solid " + C.imp,
      padding: "20px 24px",
    }}>
      <style>{`@keyframes expandIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ animation: "expandIn 0.18s ease" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? C.border2 : "none",
              border: "1px solid " + (tab === t.id ? C.border2 : C.border),
              borderRadius: 7, padding: "4px 14px", fontSize: 11, cursor: "pointer",
              color: tab === t.id ? C.text : C.textDim, transition: "all 0.12s",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 20 }}>
          {/* Chart */}
          <div>
            {tab === "share" && (
              <ResponsiveContainer width="100%" height={185}>
                <LineChart data={chartData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="week" tick={{ fill: C.textDim, fontSize: 10 }} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 10 }} unit="%" width={36} />
                  <Tooltip contentStyle={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, fontSize: 11 }} formatter={v => v.toFixed(1) + "%"} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Imp Share" stroke={C.imp} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Clk Share" stroke={C.clk} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Pur Share" stroke={C.pur} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {tab === "vol" && (
              <ResponsiveContainer width="100%" height={185}>
                <ComposedChart data={chartData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volgk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.vol} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={C.vol} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="week" tick={{ fill: C.textDim, fontSize: 10 }} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 10 }} width={40} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
                  <Tooltip contentStyle={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, fontSize: 11 }} formatter={v => [v.toLocaleString(), "SQ Volume"]} />
                  <Area type="monotone" dataKey="SQ Volume" stroke={C.vol} strokeWidth={2} fill="url(#volgk)" dot={{ r: 3, fill: C.vol }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            {tab === "counts" && (
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={chartData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="week" tick={{ fill: C.textDim, fontSize: 10 }} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 10 }} width={32} />
                  <Tooltip contentStyle={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Imp #" fill={C.imp} opacity={0.85} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Clk #" fill={C.clk} opacity={0.85} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Pur #" fill={C.pur} opacity={0.85} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* WoW table — oldest to newest top to bottom */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid " + C.border }}>
                  {["Week","SQ Vol","ΔVol","Imp%","Δ","Clk%","Δ","Pur%","Δ"].map((h, i) => (
                    <th key={i} style={{ padding: "4px 7px", color: C.textDim, fontWeight: 500, textAlign: i === 0 ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekRows.map((r, i) => {
                  const p    = i > 0 ? weekRows[i - 1] : null;
                  const vol  = num(r["Search Query Volume"]);
                  const pvol = p ? num(p["Search Query Volume"]) : null;
                  const imp  = pct(r["Impressions: Brand Share %"]);
                  const pimp = p ? pct(p["Impressions: Brand Share %"]) : null;
                  const clk  = pct(r["Clicks: Brand Share %"]);
                  const pclk = p ? pct(p["Clicks: Brand Share %"]) : null;
                  const pur  = pct(r["Purchases: Brand Share %"]);
                  const ppur = p ? pct(p["Purchases: Brand Share %"]) : null;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid " + C.border + "18" }}>
                      <td style={{ padding: "5px 7px", color: C.imp, fontWeight: 600, whiteSpace: "nowrap" }}>{r._week}</td>
                      <td style={{ padding: "5px 7px", textAlign: "right", color: C.vol, fontWeight: 500 }}>{vol ? vol.toLocaleString() : "–"}</td>
                      <td style={{ padding: "5px 7px", textAlign: "right" }}><Badge value={pvol !== null ? vol - pvol : null} unit="n" small /></td>
                      <td style={{ padding: "5px 7px", textAlign: "right", color: C.text }}>{fmtP(imp)}</td>
                      <td style={{ padding: "5px 7px", textAlign: "right" }}><Badge value={pimp !== null ? imp - pimp : null} unit="%" small /></td>
                      <td style={{ padding: "5px 7px", textAlign: "right", color: C.text }}>{fmtP(clk)}</td>
                      <td style={{ padding: "5px 7px", textAlign: "right" }}><Badge value={pclk !== null ? clk - pclk : null} unit="%" small /></td>
                      <td style={{ padding: "5px 7px", textAlign: "right", color: C.text }}>{fmtP(pur)}</td>
                      <td style={{ padding: "5px 7px", textAlign: "right" }}><Badge value={ppur !== null ? pur - ppur : null} unit="%" small /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Per-KPI mini cell with sparkline ──────────────────────────── */
function KpiCell({ value, prevValue, sparkData, color, unit, display, showBar }) {
  const d = (prevValue !== null && prevValue !== undefined) ? value - prevValue : null;
  return (
    <div style={{ padding: "8px 14px", borderLeft: "1px solid " + C.border + "18", display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color, fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{display}</span>
        <Badge value={d} unit={unit} small />
      </div>
      {showBar && (
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden" }}>
          <div style={{ width: Math.min(value, 100) + "%", height: "100%", background: color, opacity: 0.6 }} />
        </div>
      )}
      <Spark data={sparkData} color={color} width={80} height={28} />
    </div>
  );
}

/* ─── Keyword Row ────────────────────────────────────────────────── */
function KeywordRow({ row, prevRow, allWeeks, kwHistory, isEven, isExpanded, onToggle }) {
  const impShare = pct(row["Impressions: Brand Share %"]);
  const clkShare = pct(row["Clicks: Brand Share %"]);
  const purShare = pct(row["Purchases: Brand Share %"]);
  const sqVol    = num(row["Search Query Volume"]);
  const pImp = prevRow ? pct(prevRow["Impressions: Brand Share %"]) : null;
  const pClk = prevRow ? pct(prevRow["Clicks: Brand Share %"]) : null;
  const pPur = prevRow ? pct(prevRow["Purchases: Brand Share %"]) : null;
  const pVol = prevRow ? num(prevRow["Search Query Volume"]) : null;

  // kwHistory is in chronological order (oldest → newest) = left → right in spark
  const sparkImp = kwHistory.map(r => r ? pct(r["Impressions: Brand Share %"]) : 0);
  const sparkClk = kwHistory.map(r => r ? pct(r["Clicks: Brand Share %"]) : 0);
  const sparkPur = kwHistory.map(r => r ? pct(r["Purchases: Brand Share %"]) : 0);
  const sparkVol = kwHistory.map(r => r ? num(r["Search Query Volume"]) : 0);

  const baseBg = isExpanded ? C.card2 : isEven ? "transparent" : "#ffffff03";

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr 1fr 1fr 1fr 28px",
          alignItems: "stretch",
          background: baseBg,
          borderBottom: "1px solid " + C.border + "14",
          borderLeft: isExpanded ? "2px solid " + C.imp : "2px solid transparent",
          cursor: "pointer",
          transition: "background 0.12s",
        }}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#22d3ee07"; }}
        onMouseLeave={e => { e.currentTarget.style.background = baseBg; }}
      >
        {/* Keyword name */}
        <div style={{ padding: "10px 14px 10px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
          <span style={{ color: C.text, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>
            {row["Search Query"]}
          </span>
          <span style={{ color: C.textDim, fontSize: 10 }}>
            Score {row["Search Query Score"] || "–"} · Vol {sqVol ? sqVol.toLocaleString() : "–"}
          </span>
        </div>

        <KpiCell value={sqVol}    prevValue={pVol}  sparkData={sparkVol} color={C.vol} unit="n" display={sqVol ? sqVol.toLocaleString() : "–"} showBar={false} />
        <KpiCell value={impShare} prevValue={pImp}  sparkData={sparkImp} color={C.imp} unit="%" display={fmtP(impShare)} showBar />
        <KpiCell value={clkShare} prevValue={pClk}  sparkData={sparkClk} color={C.clk} unit="%" display={fmtP(clkShare)} showBar />
        <KpiCell value={purShare} prevValue={pPur}  sparkData={sparkPur} color={C.pur} unit="%" display={fmtP(purShare)} showBar />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
          <ChevronRight size={13} style={{
            color: C.textDim,
            transform: isExpanded ? "rotate(90deg)" : "none",
            transition: "transform 0.2s",
          }} />
        </div>
      </div>

      {isExpanded && <ExpandedRow keyword={row["Search Query"]} allWeeks={allWeeks} />}
    </>
  );
}

/* ─── Upload Zone ────────────────────────────────────────────────── */
function UploadZone({ onFiles, compact }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();
  const handle = useCallback(async files => {
    const results = [];
    for (const f of files) results.push({ name: f.name, text: await f.text() });
    onFiles(results);
  }, [onFiles]);

  if (compact) {
    return (
      <div
        onClick={() => inputRef.current.click()}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: "1px solid " + C.border, borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontSize: 11, color: C.textDim, transition: "border-color 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.imp}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
      >
        <Upload size={13} style={{ color: C.imp }} /> Add more weeks
        <input ref={inputRef} type="file" accept=".csv" multiple style={{ display: "none" }} onChange={e => handle([...e.target.files])} />
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle([...e.dataTransfer.files]); }}
      onClick={() => inputRef.current.click()}
      style={{ border: "2px dashed " + (drag ? C.imp : C.border), borderRadius: 16, padding: "56px 32px", textAlign: "center", cursor: "pointer", transition: "all 0.18s", background: drag ? "#22d3ee07" : C.card }}
    >
      <input ref={inputRef} type="file" accept=".csv" multiple style={{ display: "none" }} onChange={e => handle([...e.target.files])} />
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "#22d3ee12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Upload size={26} style={{ color: C.imp }} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Drop SQP reports here</div>
      <div style={{ color: C.textDim, fontSize: 13, marginBottom: 6 }}>Upload up to 12 weekly Brand-level SQP CSV files</div>
      <div style={{ color: C.muted, fontSize: 11 }}>GB_Search_query_performance_Brand_view_Simple_Week_*.csv</div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────── */
export default function App() {
  const [allWeeks, setAllWeeks]     = useState([]);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(-1);
  const [expandedKw, setExpandedKw] = useState(null);
  const [search, setSearch]         = useState("");
  const [sortKpi, setSortKpi]       = useState("imp");
  const [sortDir, setSortDir]       = useState("desc");
  const [page, setPage]             = useState(0);
  const PAGE = 25;

  const handleFiles = useCallback(files => {
    const parsed = files.map(f => parseCSV(f.text)).filter(Boolean);
    setAllWeeks(prev => {
      const combined = [...prev];
      for (const w of parsed) {
        if (!combined.find(x => x.weekLabel === w.weekLabel)) combined.push(w);
      }
      // CRITICAL: sort by real calendar date, not week number
      // Week 50/2025 (sortKey ≈ Dec 2025) must come before Week 1/2026 (sortKey ≈ Jan 2026)
      const sorted = combined.sort((a, b) => a.sortKey - b.sortKey).slice(-12);
      setSelectedWeekIdx(sorted.length - 1);
      return sorted;
    });
    setPage(0);
  }, []);

  const activeIdx  = selectedWeekIdx >= 0 && selectedWeekIdx < allWeeks.length ? selectedWeekIdx : allWeeks.length - 1;
  const latestWeek = allWeeks[activeIdx];
  const prevWeek   = activeIdx > 0 ? allWeeks[activeIdx - 1] : undefined;

  /* Aggregate KPI totals per week for top cards — in sorted order */
  const trendData = useMemo(() => allWeeks.map(w => {
    const agg = (tField, bField) => {
      const t = w.rows.reduce((s, r) => s + num(r[tField]), 0);
      const b = w.rows.reduce((s, r) => s + num(r[bField]), 0);
      return t ? +(b / t * 100).toFixed(2) : 0;
    };
    return {
      week: w.weekShort,   // "W8 '26", "W9 '26" etc — chronological
      imp:  agg("Impressions: Total Count", "Impressions: Brand Count"),
      clk:  agg("Clicks: Total Count",      "Clicks: Brand Count"),
      pur:  agg("Purchases: Total Count",   "Purchases: Brand Count"),
      vol:  w.rows.reduce((s, r) => s + num(r["Search Query Volume"]), 0),
    };
  }), [allWeeks]);

  const latest = trendData[activeIdx];
  const prevTd = activeIdx > 0 ? trendData[activeIdx - 1] : undefined;

  /* Per-keyword multi-week history — in same chronological order as allWeeks */
  const kwHistoryMap = useMemo(() => {
    const map = {};
    if (!latestWeek) return map;
    latestWeek.rows.forEach(row => {
      const kw = row["Search Query"];
      map[kw] = allWeeks.map(w => w.rows.find(r => r["Search Query"] === kw) || null);
    });
    return map;
  }, [allWeeks, latestWeek]);

  /* Sort */
  const sortField = KPI_DEFS.find(k => k.id === sortKpi)?.field;
  const sortIsVol = sortKpi === "vol";

  const filtered = useMemo(() => {
    if (!latestWeek) return [];
    let rows = latestWeek.rows.filter(r =>
      r["Search Query"].toLowerCase().includes(search.toLowerCase())
    );
    return [...rows].sort((a, b) => {
      const av = sortIsVol ? num(a[sortField]) : pct(a[sortField]);
      const bv = sortIsVol ? num(b[sortField]) : pct(b[sortField]);
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [latestWeek, search, sortKpi, sortDir]);

  const pageRows   = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  function toggleSort(id) {
    if (sortKpi === id) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKpi(id); setSortDir("desc"); }
    setPage(0);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500&display=swap" rel="stylesheet" />
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>

        {/* Header */}
        <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "14px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#22d3ee14", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={17} style={{ color: C.imp }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}>
                SQP <span style={{ color: C.imp }}>Intelligence</span>
              </div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1.5 }}>SEARCH QUERY PERFORMANCE · BRAND VIEW</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {allWeeks.map((w, i) => (
              <div
                key={w.weekLabel}
                title={w.weekLabel + " · " + w.weekDate}
                onClick={() => { setSelectedWeekIdx(i); setExpandedKw(null); setPage(0); }}
                style={{
                  padding: "3px 9px", borderRadius: 5, fontSize: 10,
                  cursor: "pointer", transition: "all 0.15s",
                  background: i === activeIdx ? C.imp + "20" : "none",
                  border: "1px solid " + (i === activeIdx ? C.imp : C.border),
                  color: i === activeIdx ? C.imp : C.textDim,
                }}
              >
                {/* Show year only when it changes */}
                {(i === 0 || allWeeks[i - 1].weekYear !== w.weekYear)
                  ? w.weekLabel + " '" + String(w.weekYear).slice(2)
                  : w.weekShort}
              </div>
            ))}
            {allWeeks.length > 0 && <UploadZone onFiles={handleFiles} compact />}
          </div>
        </div>

        <div style={{ padding: "22px 26px", maxWidth: 1500, margin: "0 auto" }}>
          {allWeeks.length === 0 ? (
            <div style={{ maxWidth: 520, margin: "60px auto" }}>
              <UploadZone onFiles={handleFiles} compact={false} />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
                {KPI_DEFS.map(kpi => (
                  <KpiCard
                    key={kpi.id} kpi={kpi}
                    trendData={trendData}
                    latestVal={latest ? latest[kpi.id] : null}
                    prevVal={prevTd ? prevTd[kpi.id] : null}
                  />
                ))}
              </div>

              {/* Keyword table */}
              <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden" }}>

                {/* Toolbar */}
                <div style={{ padding: "12px 18px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    Keywords &nbsp;
                    <span style={{ color: C.textSub }}>{latestWeek ? (latestWeek.weekShort || latestWeek.weekLabel) : ""}</span>
                    {allWeeks.length > 1 && <span style={{ color: C.muted }}>&nbsp;({activeIdx + 1}/{allWeeks.length})</span>}
                    &nbsp;·&nbsp;<span style={{ color: C.imp }}>{filtered.length}</span> terms
                    &nbsp;·&nbsp;<span style={{ color: C.muted }}>click row to expand WoW</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "5px 12px" }}>
                    <Search size={12} style={{ color: C.muted }} />
                    <input
                      value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                      placeholder="Filter keywords..."
                      style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 12, width: 190 }}
                    />
                    {search && <X size={11} style={{ color: C.muted, cursor: "pointer" }} onClick={() => setSearch("")} />}
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr 1fr 1fr 28px", background: C.surface, borderBottom: "1px solid " + C.border }}>
                  <div style={{ padding: "9px 14px 9px 20px", color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>Keyword</div>
                  {KPI_DEFS.map(kpi => {
                    const Icon = kpi.icon;
                    const active = sortKpi === kpi.id;
                    return (
                      <div
                        key={kpi.id}
                        onClick={() => toggleSort(kpi.id)}
                        style={{
                          padding: "9px 14px", display: "flex", alignItems: "center", gap: 5,
                          cursor: "pointer", userSelect: "none",
                          color: active ? kpi.color : C.textDim,
                          fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2,
                          borderLeft: "1px solid " + C.border,
                          transition: "color 0.12s",
                        }}
                      >
                        <Icon size={11} /> {kpi.label}
                        {active && (sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                      </div>
                    );
                  })}
                  <div />
                </div>

                {/* Keyword rows */}
                {pageRows.map((row, i) => {
                  const kw   = row["Search Query"];
                  const pr   = prevWeek?.rows.find(r => r["Search Query"] === kw) || null;
                  const hist = kwHistoryMap[kw] || allWeeks.map(() => null);
                  return (
                    <KeywordRow
                      key={kw}
                      row={row}
                      prevRow={pr}
                      allWeeks={allWeeks}
                      kwHistory={hist}
                      isEven={i % 2 === 0}
                      isExpanded={expandedKw === kw}
                      onToggle={() => setExpandedKw(expandedKw === kw ? null : kw)}
                    />
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ padding: "10px 18px", display: "flex", gap: 5, justifyContent: "center", borderTop: "1px solid " + C.border, flexWrap: "wrap" }}>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      style={{ background: "none", border: "1px solid " + C.border, borderRadius: 6, color: page === 0 ? C.muted : C.textDim, cursor: page === 0 ? "default" : "pointer", padding: "3px 10px", fontSize: 11 }}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                      <button key={i} onClick={() => setPage(i)} style={{
                        background: page === i ? C.imp : "none",
                        color: page === i ? "#000" : C.textDim,
                        border: "1px solid " + (page === i ? C.imp : C.border),
                        borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11,
                      }}>{i + 1}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                      style={{ background: "none", border: "1px solid " + C.border, borderRadius: 6, color: page === totalPages - 1 ? C.muted : C.textDim, cursor: page === totalPages - 1 ? "default" : "pointer", padding: "3px 10px", fontSize: 11 }}>›</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
