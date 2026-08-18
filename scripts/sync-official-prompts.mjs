import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const sourceDir = process.env.MOTIONSITES_OFFICIAL_SOURCE
  ? path.resolve(process.env.MOTIONSITES_OFFICIAL_SOURCE)
  : path.resolve(projectRoot, "data", "official-prompts");
const catalogFile = path.resolve(projectRoot, "app", "prompt-data.ts");
const outputFile = path.resolve(projectRoot, "public", "data", "official-prompts.local.json");
const requireComplete = process.argv.includes("--require-complete");

function parseCatalog(raw) {
  const assignment = raw.indexOf("= [", raw.indexOf("export const promptData"));
  const end = raw.lastIndexOf("];");
  if (assignment < 0 || end < 0) throw new Error("无法解析 app/prompt-data.ts");
  return JSON.parse(raw.slice(assignment + 2, end + 1));
}

function scalar(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed.replace(/^['"]|['"]$/g, "");
  }
}

function parseFrontmatter(raw, file) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`${file} 缺少 YAML frontmatter`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-z_]+):\s*(.*)$/);
    if (pair) meta[pair[1]] = scalar(pair[2]);
  }
  return { meta, body: raw.slice(match[0].length) };
}

function markedBlock(body, name) {
  const marker = name.toUpperCase();
  const match = body.match(new RegExp(`<!-- ${marker}_START -->\\r?\\n([\\s\\S]*?)\\r?\\n<!-- ${marker}_END -->`));
  return match?.[1]?.trim() ?? "";
}

function legacyBlock(body, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return body.match(new RegExp("^## " + escapedHeading + "\\s*\\r?\\n```(?:text|markdown)?\\s*\\r?\\n([\\s\\S]*?)\\r?\\n```", "m"))?.[1]?.trim() ?? "";
}

function normalizeEntry(input, origin) {
  const id = String(input.id ?? "").trim();
  const officialPrompt = String(input.officialPrompt ?? input.official_prompt ?? "").trim();
  const officialPromptZh = String(input.officialPromptZh ?? input.official_prompt_zh ?? "").trim();
  return {
    id,
    sourceUrl: String(input.sourceUrl ?? input.source_url ?? "").trim(),
    capturedAt: String(input.capturedAt ?? input.captured_at ?? input.official_prompt_verified_at ?? "").trim(),
    provenance: String(input.provenance ?? input.official_prompt_provenance ?? "user-provided-official-copy").trim(),
    officialPrompt,
    officialPromptZh,
    origin,
  };
}

async function readEntries() {
  await fs.mkdir(sourceDir, { recursive: true });
  const names = (await fs.readdir(sourceDir)).sort((left, right) => left.localeCompare(right));
  const entries = [];
  for (const name of names) {
    const file = path.join(sourceDir, name);
    if (name.toLowerCase() === "readme.md" || name.endsWith(".example")) continue;
    if (name.endsWith(".md")) {
      const raw = await fs.readFile(file, "utf8");
      const { meta, body } = parseFrontmatter(raw, name);
      entries.push(normalizeEntry({
        ...meta,
        officialPrompt: markedBlock(body, "OFFICIAL_PROMPT") || legacyBlock(body, "官网原文"),
        officialPromptZh: markedBlock(body, "OFFICIAL_PROMPT_ZH") || legacyBlock(body, "官方原文中文翻译"),
      }, name));
      continue;
    }
    if (name.endsWith(".json")) {
      const parsed = JSON.parse(await fs.readFile(file, "utf8"));
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.entries) ? parsed.entries : [parsed];
      items.forEach((item, index) => entries.push(normalizeEntry(item, `${name}#${index + 1}`)));
    }
  }
  return entries;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

const catalog = parseCatalog(await fs.readFile(catalogFile, "utf8"));
const catalogById = new Map(catalog.map((record) => [record.id, record]));
const rawEntries = await readEntries();
const seen = new Map();
const entries = [];

for (const entry of rawEntries) {
  if (!entry.id) throw new Error(`${entry.origin} 缺少 id`);
  if (!catalogById.has(entry.id)) throw new Error(`${entry.origin} 使用了未知 ID：${entry.id}`);
  if (seen.has(entry.id)) throw new Error(`ID ${entry.id} 重复：${seen.get(entry.id)} 与 ${entry.origin}`);
  if (entry.officialPrompt.length < 80) throw new Error(`${entry.origin} 的官网原文为空或明显不完整`);
  const catalogRecord = catalogById.get(entry.id);
  if (entry.sourceUrl && entry.sourceUrl !== catalogRecord.sourceUrl) {
    throw new Error(`${entry.origin} 的 source_url 与目录不一致：${entry.sourceUrl}`);
  }
  seen.set(entry.id, entry.origin);
  entries.push({
    id: entry.id,
    sourceUrl: catalogRecord.sourceUrl,
    capturedAt: entry.capturedAt || null,
    provenance: entry.provenance,
    officialPrompt: entry.officialPrompt,
    officialPromptZh: entry.officialPromptZh,
    sha256: sha256(entry.officialPrompt),
    translationSha256: entry.officialPromptZh ? sha256(entry.officialPromptZh) : null,
  });
}

entries.sort((left, right) => catalog.findIndex((record) => record.id === left.id) - catalog.findIndex((record) => record.id === right.id));
const translatedCount = entries.filter((entry) => entry.officialPromptZh).length;
const missingIds = catalog.filter((record) => !seen.has(record.id)).map((record) => record.id);
const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  catalogCount: catalog.length,
  officialCount: entries.length,
  translatedCount,
  missingCount: missingIds.length,
  missingIds,
  entries,
};

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`本地官网原文已同步：${entries.length}/${catalog.length}`);
console.log(`已有中文翻译：${translatedCount}/${entries.length}`);
console.log(`待补官网原文：${missingIds.length}`);
console.log(`运行时数据：${path.relative(projectRoot, outputFile)}`);

if (requireComplete && entries.length !== catalog.length) {
  throw new Error(`完整性门禁未通过：仍缺少 ${missingIds.length} 个官网原文`);
}
