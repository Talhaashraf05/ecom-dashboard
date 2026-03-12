import { useState, useEffect } from "react";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import { seedFromPublic } from "./lib/seed";
import { ThemeProvider, useTheme } from "./lib/theme";

function AppInner() {
  const { C } = useTheme();
  const [selectedProject, setSelectedProject] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedFromPublic().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
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

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
