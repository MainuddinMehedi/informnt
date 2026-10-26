import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROFILES_DIR = path.join(
  __dirname,
  "../docs/1. Domain specific/source-profiles",
);
const OUTPUT_PATH = path.join(
  __dirname,
  "../ingestion-service/data/publishers.json",
);

const EXCLUDED_FILES = new Set([
  "evidence-register.json",
  "feed-validation-registry.json",
]);

export function compilePublishers() {
  console.log("📦 Compiling publisher profiles from:", PROFILES_DIR);

  if (!fs.existsSync(PROFILES_DIR)) {
    throw new Error(`Source profiles directory not found: ${PROFILES_DIR}`);
  }

  const files = fs
    .readdirSync(PROFILES_DIR)
    .filter((f) => f.endsWith(".json") && !EXCLUDED_FILES.has(f));

  console.log(`Found ${files.length} publisher profile files.`);

  const publishers = [];

  for (const file of files) {
    const fullPath = path.join(PROFILES_DIR, file);
    const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    if (!content.facts?.identity?.slug) {
      console.warn(
        `⚠️ Warning: ${file} is missing facts.identity.slug, skipping.`,
      );
      continue;
    }

    publishers.push(content);
  }

  // Sort deterministically by slug
  publishers.sort((a, b) =>
    a.facts.identity.slug.localeCompare(b.facts.identity.slug),
  );

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(publishers, null, 2), "utf8");

  console.log(
    `✅ Successfully compiled ${publishers.length} publishers into: ${OUTPUT_PATH}\n`,
  );

  return publishers;
}

// Allow standalone CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    compilePublishers();
  } catch (err) {
    console.error("❌ Failed to compile publishers:", err);
    process.exit(1);
  }
}
