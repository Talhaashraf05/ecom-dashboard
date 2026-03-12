const DB_NAME = "sqp_intelligence";
const DB_VERSION = 1;

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("files")) {
        const store = db.createObjectStore("files", { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, stores, mode = "readonly") {
  const t = db.transaction(stores, mode);
  return stores.length === 1 ? t.objectStore(stores[0]) : stores.map(s => t.objectStore(s));
}

function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

/* ─── Projects ───────────────────────────────────────────────────── */

export async function getProjects() {
  const db = await open();
  return req(tx(db, ["projects"]).getAll());
}

export async function getProject(id) {
  const db = await open();
  return req(tx(db, ["projects"]).get(id));
}

export async function createProject(name) {
  const db = await open();
  const project = { id: crypto.randomUUID(), name, createdAt: Date.now() };
  await req(tx(db, ["projects"], "readwrite").put(project));
  return project;
}

export async function deleteProject(id) {
  const db = await open();
  const t = db.transaction(["projects", "files"], "readwrite");
  t.objectStore("projects").delete(id);
  // delete all files for this project
  const fileStore = t.objectStore("files");
  const idx = fileStore.index("projectId");
  const range = IDBKeyRange.only(id);
  const cursor = idx.openCursor(range);
  await new Promise((resolve, reject) => {
    cursor.onsuccess = (e) => {
      const c = e.target.result;
      if (c) { c.delete(); c.continue(); }
      else resolve();
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

export async function renameProject(id, name) {
  const db = await open();
  const store = tx(db, ["projects"], "readwrite");
  const project = await req(store.get(id));
  if (project) {
    project.name = name;
    await req(store.put(project));
  }
  return project;
}

/* ─── Files ──────────────────────────────────────────────────────── */

export async function getFiles(projectId) {
  const db = await open();
  const store = tx(db, ["files"]);
  const idx = store.index("projectId");
  return req(idx.getAll(projectId));
}

export async function addFiles(projectId, files) {
  const db = await open();
  const store = tx(db, ["files"], "readwrite");
  const added = [];
  for (const f of files) {
    const record = {
      id: crypto.randomUUID(),
      projectId,
      name: f.name,
      text: f.text,
      uploadedAt: Date.now(),
    };
    await req(store.put(record));
    added.push(record);
  }
  return added;
}

export async function deleteFile(fileId) {
  const db = await open();
  await req(tx(db, ["files"], "readwrite").delete(fileId));
}
