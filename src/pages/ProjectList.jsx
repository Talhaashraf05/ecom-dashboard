import { useState, useEffect, useRef } from "react";
import { Plus, FolderOpen, Trash2, Layers } from "lucide-react";
import { getProjects, createProject, deleteProject } from "../lib/db";

const C = {
  bg: "#080b12", surface: "#0e1118", card: "#131720", card2: "#181d28",
  border: "#1d2438", border2: "#242d42", imp: "#22d3ee", text: "#e2e8f0",
  textDim: "#64748b", textSub: "#94a3b8", muted: "#374151", red: "#f87171",
};

export default function ProjectList({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef();

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (showNew && inputRef.current) inputRef.current.focus(); }, [showNew]);

  async function loadProjects() {
    const list = await getProjects();
    setProjects(list.sort((a, b) => b.createdAt - a.createdAt));
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    await createProject(name);
    setNewName("");
    setShowNew(false);
    await loadProjects();
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this project and all its files?")) return;
    await deleteProject(id);
    await loadProjects();
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500&display=swap" rel="stylesheet" />
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>

        {/* Header */}
        <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "14px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        </div>

        <div style={{ padding: "32px 26px", maxWidth: 900, margin: "0 auto" }}>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Projects</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Select a project to view its SQP dashboard</div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: C.imp, color: "#000", border: "none", borderRadius: 9,
                padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Plus size={15} /> New Project
            </button>
          </div>

          {/* New project input */}
          {showNew && (
            <div style={{
              background: C.card, border: "1px solid " + C.imp + "40",
              borderRadius: 12, padding: "16px 20px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <input
                ref={inputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNew(false); }}
                placeholder="Project name (e.g. Infinity, AbLabs...)"
                style={{
                  flex: 1, background: C.surface, border: "1px solid " + C.border,
                  borderRadius: 8, padding: "8px 14px", color: C.text, fontSize: 13,
                  outline: "none", fontFamily: "'DM Mono', monospace",
                }}
              />
              <button
                onClick={handleCreate}
                style={{
                  background: C.imp, color: "#000", border: "none", borderRadius: 8,
                  padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Syne', sans-serif",
                }}
              >Create</button>
              <button
                onClick={() => { setShowNew(false); setNewName(""); }}
                style={{
                  background: "none", color: C.textDim, border: "1px solid " + C.border,
                  borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer",
                }}
              >Cancel</button>
            </div>
          )}

          {/* Project grid */}
          {projects.length === 0 && !showNew ? (
            <div style={{
              textAlign: "center", padding: "80px 20px",
              background: C.card, borderRadius: 16, border: "1px solid " + C.border,
            }}>
              <FolderOpen size={40} style={{ color: C.muted, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                No projects yet
              </div>
              <div style={{ color: C.textDim, fontSize: 12 }}>
                Create your first project to start tracking SQP data
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    background: C.card, border: "1px solid " + C.border, borderRadius: 14,
                    padding: "20px", cursor: "pointer", transition: "all 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.imp; e.currentTarget.style.background = C.card2; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.textDim }}>
                        Created {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      onClick={e => handleDelete(e, p.id)}
                      style={{
                        padding: 6, borderRadius: 6, cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.red + "20"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Trash2 size={13} style={{ color: C.red }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
