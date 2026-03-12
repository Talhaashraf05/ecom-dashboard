#!/usr/bin/env node

/**
 * export-to-public.js
 *
 * Usage:
 *   node scripts/export-to-public.js <project-slug> <project-name> <csv-folder>
 *
 * Example:
 *   node scripts/export-to-public.js nfinity "Nfinity" ./my-csvs/
 *
 * This copies all .csv files from <csv-folder> into public/data/<project-slug>/
 * and updates public/data/manifest.json automatically.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from "fs";
import { join, basename, resolve } from "path";

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("Usage: node scripts/export-to-public.js <project-slug> <project-name> <csv-folder>");
  console.log('Example: node scripts/export-to-public.js nfinity "Nfinity" ./my-csvs/');
  process.exit(1);
}

const [slug, name, csvFolder] = args;
const root = resolve(import.meta.dirname, "..");
const dataDir = join(root, "public", "data");
const projectDir = join(dataDir, slug);
const manifestPath = join(dataDir, "manifest.json");

// Create project directory
mkdirSync(projectDir, { recursive: true });

// Copy CSV files
const csvFiles = readdirSync(csvFolder).filter(f => f.endsWith(".csv"));
if (csvFiles.length === 0) {
  console.error("No .csv files found in", csvFolder);
  process.exit(1);
}

for (const f of csvFiles) {
  copyFileSync(join(csvFolder, f), join(projectDir, f));
}

// Update manifest
let manifest = { projects: [] };
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, "utf-8")); } catch {}
}

const existing = manifest.projects.findIndex(p => p.slug === slug);
const entry = { slug, name, files: csvFiles };

if (existing >= 0) {
  manifest.projects[existing] = entry;
} else {
  manifest.projects.push(entry);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`✓ Copied ${csvFiles.length} CSV files to public/data/${slug}/`);
console.log(`✓ Updated manifest.json`);
console.log(`\nProject "${name}" will be available to all users after deploy.`);
