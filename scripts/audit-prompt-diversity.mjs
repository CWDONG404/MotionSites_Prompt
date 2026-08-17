import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const dataFile = path.join(projectRoot, "app", "prompt-data.ts");
const sourceDir = process.env.MOTIONSITES_PROMPT_SOURCE
  ? path.resolve(process.env.MOTIONSITES_PROMPT_SOURCE)
  : path.resolve(projectRoot, "..", "motionsites-free-prompts-2026-08-17", "prompts");

function parseData(raw) {
  const assignment = raw.indexOf("= [", raw.indexOf("export const promptData"));
  const end = raw.lastIndexOf("];");
  if (assignment < 0 || end < 0) throw new Error("无法解析 app/prompt-data.ts");
  return JSON.parse(raw.slice(assignment + 2, end + 1));
}

function promptBlock(raw, heading) {
  return raw.match(new RegExp("## " + heading + "\\s+```text\\s*([\\s\\S]*?)\\s*```"))?.[1]?.trim() ?? "";
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function wordShingles(text, size = 5) {
  const words = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const shingles = new Set();
  for (let index = 0; index <= words.length - size; index += 1) shingles.add(words.slice(index, index + size).join(" "));
  return shingles;
}

function chineseShingles(text, size = 14) {
  const chars = [...text.replace(/[\s\p{P}\p{S}]+/gu, "")];
  const shingles = new Set();
  for (let index = 0; index <= chars.length - size; index += 2) shingles.add(chars.slice(index, index + size).join(""));
  return shingles;
}

function jaccard(left, right) {
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  const union = left.size + right.size - intersection;
  return union ? intersection / union : 0;
}

function report(records, language) {
  const prompts = records.map((record) => language === "en" ? record.prompt : record.promptZh);
  const hashes = new Set(prompts.map((prompt) => crypto.createHash("sha256").update(prompt).digest("hex")));
  const lineLists = prompts.map((prompt) => prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  const lineCounts = new Map();
  for (const lines of lineLists) {
    for (const line of new Set(lines)) lineCounts.set(line, (lineCounts.get(line) ?? 0) + 1);
  }
  const highFrequencyLines = new Set([...lineCounts].filter(([, count]) => count >= 100).map(([line]) => line));
  const highFrequencyRatios = lineLists.map((lines) => lines.filter((line) => highFrequencyLines.has(line)).length / lines.length);
  const shingleSets = prompts.map((prompt) => language === "en" ? wordShingles(prompt) : chineseShingles(prompt));
  const similarities = [];
  let maximum = { score: 0, pair: [] };
  for (let left = 0; left < shingleSets.length; left += 1) {
    for (let right = left + 1; right < shingleSets.length; right += 1) {
      const score = jaccard(shingleSets[left], shingleSets[right]);
      similarities.push(score);
      if (score > maximum.score) maximum = { score, pair: [records[left].id, records[right].id] };
    }
  }
  const lengths = prompts.map((prompt) => prompt.length);
  return {
    count: prompts.length,
    uniqueHashes: hashes.size,
    identicalLinesAll147: [...lineCounts.values()].filter((count) => count === prompts.length).length,
    linesUsedBy100Plus: highFrequencyLines.size,
    medianHighFrequencyLinePercent: Number((percentile(highFrequencyRatios, 0.5) * 100).toFixed(1)),
    minChars: Math.min(...lengths),
    medianChars: percentile(lengths, 0.5),
    averageSimilarityPercent: Number((similarities.reduce((sum, value) => sum + value, 0) / similarities.length * 100).toFixed(1)),
    p95SimilarityPercent: Number((percentile(similarities, 0.95) * 100).toFixed(1)),
    maxSimilarityPercent: Number((Math.max(...similarities) * 100).toFixed(1)),
    maxSimilarityPair: maximum.pair,
  };
}

function requireEvery(records, selector, pattern, description) {
  const missing = records.filter((record) => !pattern.test(selector(record))).map((record) => record.id);
  if (missing.length) throw new Error(`${description} 缺失：${missing.slice(0, 8).join(", ")}`);
}

const records = parseData(await fs.readFile(dataFile, "utf8"));
if (records.length !== 147) throw new Error(`提示词数量应为 147，实际 ${records.length}`);
if (new Set(records.map((record) => record.id)).size !== 147) throw new Error("提示词 ID 不唯一");

requireEvery(records, (record) => record.prompt, /(?=[\s\S]*React 19)(?=[\s\S]*TypeScript)(?=[\s\S]*Vite)(?=[\s\S]*Tailwind CSS v4)(?=[\s\S]*motion\/react)(?=[\s\S]*lucide-react)/i, "英文技术栈");
requireEvery(records, (record) => record.promptZh, /(?=[\s\S]*React 19)(?=[\s\S]*TypeScript)(?=[\s\S]*Vite)(?=[\s\S]*Tailwind CSS v4)(?=[\s\S]*motion\/react)(?=[\s\S]*lucide-react)/i, "中文技术栈");
requireEvery(records, (record) => record.prompt, /360px[\s\S]*768px[\s\S]*1440px|1440px[\s\S]*768px[\s\S]*360px/i, "英文响应式断点");
requireEvery(records, (record) => record.promptZh, /360px[\s\S]*768px[\s\S]*1440px|1440px[\s\S]*768px[\s\S]*360px/i, "中文响应式断点");
requireEvery(records, (record) => record.prompt, /WCAG AA[\s\S]*keyboard[\s\S]*prefers-reduced-motion|keyboard[\s\S]*prefers-reduced-motion[\s\S]*WCAG AA/i, "英文无障碍要求");
requireEvery(records, (record) => record.promptZh, /WCAG AA[\s\S]*键盘[\s\S]*prefers-reduced-motion|键盘[\s\S]*prefers-reduced-motion[\s\S]*WCAG AA/i, "中文无障碍要求");

const results = { english: report(records, "en"), chinese: report(records, "zh"), sourceCompared: false, sourceMismatches: 0 };
try {
  const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith(".md"));
  if (files.length === 147) {
    const sourcePrompts = new Map();
    for (const file of files) {
      const raw = await fs.readFile(path.join(sourceDir, file), "utf8");
      const id = raw.match(/^id:\s+"([^"]+)"/m)?.[1];
      sourcePrompts.set(id, { en: promptBlock(raw, "原创英文提示词"), zh: promptBlock(raw, "原创中文提示词") });
    }
    results.sourceCompared = true;
    results.sourceMismatches = records.filter((record) => sourcePrompts.get(record.id)?.en !== record.prompt || sourcePrompts.get(record.id)?.zh !== record.promptZh).length;
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log(JSON.stringify(results, null, 2));

for (const [language, metrics] of [["英文", results.english], ["中文", results.chinese]]) {
  if (metrics.uniqueHashes !== 147) throw new Error(`${language}全文不唯一`);
  if (metrics.medianHighFrequencyLinePercent > 35) throw new Error(`${language}高频模板行占比仍过高：${metrics.medianHighFrequencyLinePercent}%`);
  if (metrics.p95SimilarityPercent > 72) throw new Error(`${language}P95 相似度仍过高：${metrics.p95SimilarityPercent}%`);
  if (metrics.maxSimilarityPercent > 82) throw new Error(`${language}最大相似度仍过高：${metrics.maxSimilarityPercent}%`);
}
if (results.english.minChars < 2600 || results.chinese.minChars < 1000) throw new Error("存在过短提示词");
if (results.sourceCompared && results.sourceMismatches) throw new Error(`Markdown 与前端数据错配 ${results.sourceMismatches} 项`);
