import { getProjects, createProject, getFiles, addFiles } from "./db";

const SEED_KEY = "sqp_seeded_projects";

function getSeeded() {
  try { return JSON.parse(localStorage.getItem(SEED_KEY) || "[]"); }
  catch { return []; }
}

function markSeeded(slug) {
  const list = getSeeded();
  if (!list.includes(slug)) {
    list.push(slug);
    localStorage.setItem(SEED_KEY, JSON.stringify(list));
  }
}

/**
 * Fetches public/data/manifest.json and seeds any new projects + CSV files
 * into IndexedDB. Skips projects already seeded (tracked via localStorage).
 */
export async function seedFromPublic() {
  let manifest;
  try {
    const res = await fetch("/data/manifest.json");
    if (!res.ok) return;
    manifest = await res.json();
  } catch {
    return; // no manifest or fetch failed — skip silently
  }

  const seeded = getSeeded();

  for (const proj of manifest.projects || []) {
    if (seeded.includes(proj.slug)) continue;

    // Create project in IndexedDB
    const created = await createProject(proj.name);

    // Fetch each CSV file and store it
    const fileItems = [];
    for (const fileName of proj.files || []) {
      try {
        const res = await fetch(`/data/${proj.slug}/${fileName}`);
        if (!res.ok) continue;
        const text = await res.text();
        fileItems.push({ name: fileName, text });
      } catch {
        continue;
      }
    }

    if (fileItems.length > 0) {
      await addFiles(created.id, fileItems);
    }

    markSeeded(proj.slug);
  }
}
