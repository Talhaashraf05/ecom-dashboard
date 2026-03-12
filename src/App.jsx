import { useState, useEffect } from "react";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import { seedFromPublic } from "./lib/seed";

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedFromPublic().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ background: "#080b12", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
        Loading...
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />

    );
  }

  return <ProjectList onSelect={setSelectedProject} />;
}
