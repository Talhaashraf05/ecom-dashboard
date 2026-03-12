import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Upload, Trash2, FileText, Eye, Layers } from "lucide-react";
import { getFiles, addFiles, deleteFile } from "../lib/db";
import SQPDashboard from "../components/SQPDashboard";

const C = {
  bg: "#080b12", surface: "#0e1118", card: "#131720", card2: "#181d28",
  border: "#1d2438", border2: "#242d42", imp: "#22d3ee", text: "#e2e8f0",
  textDim: "#64748b", textSub: "#94a3b8", muted: "#374151", green: "#10b981",
  red: "#f87171", vol: "#34d399",
};

export default function ProjectDetail({ project, onBack }) {
  const [files, setFiles] = useState([]);
  const [view, setView] = useState("files"); // "files" | "dashboard"
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  useEffect(() => { loadFiles(); }, [project.id]);

  async function loadFiles() {
    const list = await getFiles(project.id);
    setFiles(list.sort((a, b) => a.uploadedAt - b.uploadedAt));
  }

  const handleDrop = useCallback(async (fileList) => {
    const items = [];
    for (const f of fileList) {
      items.push({ name: f.name, text: await f.text() });
    }
    await addFiles(project.id, items);
    await loadFiles();
  }, [project.id]);

  async function handleDeleteFile(e, fileId) {
    e.stopPropagation();
    await deleteFile(fileId);
    await loadFiles();
  }

  // Called from SQPDashboard when user adds more files via the compact upload
  const handleAddFromDashboard = useCallback(async (textItems) => {
    await addFiles(project.id, textItems);
    await loadFiles();
  }, [project.id]);

  if (view === "dashboard") {
    return (
      <SQPDashboard
        csvTexts={files}
        onAddFiles={handleAddFromDashboard}
        onBack={() => setView("files")}
        projectName={project.name}
      />
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500&display=swap" rel="stylesheet" />
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>

        {/* Header */}
        <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "14px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              onClick={onBack}
              style={{ width: 34, height: 34, borderRadius: 9, background: C.card, border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.imp}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <ArrowLeft size={15} style={{ color: C.textDim }} />
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#22d3ee14", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={17} style={{ color: C.imp }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}>
                {project.name}
              </div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1.5 }}>PROJECT FILES · SQP DATA</div>
            </div>
          </div>
          {files.length > 0 && (
            <button
              onClick={() => setView("dashboard")}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: C.imp, color: "#000", border: "none", borderRadius: 9,
                padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Eye size={15} /> View Dashboard
            </button>
          )}
        </div>

        <div style={{ padding: "32px 26px", maxWidth: 900, margin: "0 auto" }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleDrop([...e.dataTransfer.files]); }}
            onClick={() => inputRef.current.click()}
            style={{
              border: "2px dashed " + (drag ? C.imp : C.border),
              borderRadius: 16, padding: "40px 32px", textAlign: "center",
              cursor: "pointer", transition: "all 0.18s",
              background: drag ? "#22d3ee07" : C.card, marginBottom: 24,
            }}
          >
            <input ref={inputRef} type="file" accept=".csv" multiple style={{ display: "none" }}
              onChange={e => { handleDrop([...e.target.files]); e.target.value = ""; }} />
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#22d3ee12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Upload size={22} style={{ color: C.imp }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>
              Drop SQP CSV files here
            </div>
            <div style={{ color: C.textDim, fontSize: 11 }}>
              or click to browse · CSV files will be saved to this project
            </div>
          </div>

          {/* File list */}
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            Uploaded Files · <span style={{ color: C.imp }}>{files.length}</span>
          </div>

          {files.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              background: C.card, borderRadius: 12, border: "1px solid " + C.border,
            }}>
              <FileText size={30} style={{ color: C.muted, marginBottom: 10 }} />
              <div style={{ color: C.textDim, fontSize: 12 }}>No files uploaded yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {files.map(f => {
                // Try to extract week info from the CSV text
                const m = f.text.match(/Select week=\["(Week \d+) \| ([\d-]+) - ([\d-]+)/);
                const weekLabel = m ? m[1] : null;
                const dateRange = m ? m[2] + " → " + m[3] : null;

                return (
                  <div
                    key={f.id}
                    style={{
                      background: C.card, border: "1px solid " + C.border, borderRadius: 10,
                      padding: "12px 16px", display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: 12, transition: "border-color 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.border2}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <FileText size={16} style={{ color: C.vol, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.name}
                        </div>
                        <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
                          {weekLabel && <span style={{ color: C.imp, fontWeight: 600 }}>{weekLabel}</span>}
                          {dateRange && <span> · {dateRange}</span>}
                          {!weekLabel && <span>Uploaded {new Date(f.uploadedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div
                      onClick={e => handleDeleteFile(e, f.id)}
                      style={{ padding: 6, borderRadius: 6, cursor: "pointer", transition: "background 0.12s", flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.red + "20"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Trash2 size={13} style={{ color: C.red }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* View Dashboard button (bottom) */}
          {files.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                onClick={() => setView("dashboard")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: C.imp, color: "#000", border: "none", borderRadius: 10,
                  padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Syne', sans-serif", transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Eye size={17} /> View Dashboard ({files.length} file{files.length !== 1 ? "s" : ""})
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
