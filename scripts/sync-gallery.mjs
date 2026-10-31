import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const galleryRoot = path.join(rootDir, "public", "Gallery-Images");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

const folders = [
  { name: "Gallery", manifest: "Gallery.json" },
  { name: "Cabs", manifest: "Cabs.json" }
];

const descriptionFromFilename = (filename) => {
  const words = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Travel photo";
};

const readManifest = async (manifestPath) => {
  try {
    const data = JSON.parse(await readFile(manifestPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

for (const folder of folders) {
  const folderPath = path.join(galleryRoot, folder.name);
  await mkdir(folderPath, { recursive: true });

  const manifestPath = path.join(folderPath, folder.manifest);
  const existing = await readManifest(manifestPath);
  const savedDescriptions = new Map(
    existing
      .filter((entry) => entry && typeof entry.url === "string")
      .map((entry) => [entry.url, typeof entry.description === "string" ? entry.description : ""])
  );

  const filenames = (await readdir(folderPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  const entries = filenames.map((filename) => {
    const url = `Gallery-Images/${folder.name}/${filename}`;
    const saved = savedDescriptions.get(url);
    return { url, description: saved ?? descriptionFromFilename(filename) };
  });

  await writeFile(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  console.log(`[gallery] ${entries.length} photo(s) synced to public/Gallery-Images/${folder.name}/${folder.manifest}`);
}
