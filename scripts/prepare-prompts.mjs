import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const sourceDir = process.env.MOTIONSITES_PROMPT_SOURCE
  ? path.resolve(process.env.MOTIONSITES_PROMPT_SOURCE)
  : path.resolve(projectRoot, "..", "motionsites-free-prompts-2026-08-17", "prompts");
const outputFile = path.resolve(projectRoot, "app", "prompt-data.ts");

// MotionSites 的旧版条目有 34 个公开预览只存在于来源页的静态资源映射中，
// 数据接口没有返回 preview_url。这里保存核验过的公开资源，避免前端显示含义不明的缩写占位。
const previewOverrides = {
  "aethera-hero": "https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif",
  "bloom-ai-hero": "https://motionsites.ai/assets/hero-bloom-ai-preview-g6RcYLTl.gif",
  "codenest-hero": "https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif",
  "datacore-booking-hero": "https://motionsites.ai/assets/hero-datacore-booking-preview-B3t9SRK6.gif",
  "design-rocket-email-hero": "https://motionsites.ai/assets/hero-design-rocket-email-preview-DBed7Yfk.gif",
  "designpro-hero": "https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif",
  "digital-epoch-hero": "https://motionsites.ai/assets/hero-digital-epoch-preview-B85ezqXO.gif",
  "digitwist-hero": "https://motionsites.ai/assets/hero-digitwist-preview-s2pJetjQ.gif",
  "duolingo-styleguide-hero": "https://motionsites.ai/assets/hero-duolingo-styleguide-preview-1HTxQ6Tj.gif",
  "glow-features": "https://motionsites.ai/assets/features-glow-poster-CmUBaPAq.png",
  "haul-footer": "https://motionsites.ai/assets/footer-haul-poster-Do5X7frB.png",
  "innovation-landing": "https://motionsites.ai/assets/hero-innovation-preview-BerBJHh1.gif",
  "kresna-footer": "https://motionsites.ai/assets/footer-kresna-preview-BrIYYd2q.gif",
  "lumina-footer": "https://motionsites.ai/assets/footer-lumina-preview-CYkr-ACN.gif",
  "luminex-hero": "https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif",
  "mindloop-landing": "https://motionsites.ai/assets/hero-mindloop-landing-preview-Bqnstohr.gif",
  "neuralyn-hero": "https://motionsites.ai/assets/hero-neuralyn-preview-Br4FRDQA.gif",
  "nexora-hero": "https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif",
  "orbis-nft-landing": "https://motionsites.ai/assets/hero-orbis-nft-preview-C3wvh77a.gif",
  "portal-hero": "https://motionsites.ai/assets/hero-portal-preview-DEscBr2T.gif",
  "portfolio-cosmic-hero": "https://motionsites.ai/assets/hero-portfolio-cosmic-preview-BpvWJ3Nc.gif",
  "power-ai-hero": "https://motionsites.ai/assets/hero-power-ai-preview-BqpSbx41.gif",
  "price-calculator": "https://motionsites.ai/assets/hero-price-calculator-preview-Dak8DDgY.gif",
  "rivr-hero": "https://motionsites.ai/assets/hero-rivr-preview-DcS3pjx4.gif",
  "securify-hero": "https://motionsites.ai/assets/hero-securify-preview-DQSYrftH.gif",
  "sentinel-ai-hero": "https://motionsites.ai/assets/hero-sentinel-ai-preview-BXas7Q1_.gif",
  "skyelite-hero": "https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif",
  "stellar-ai-hero": "https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif",
  "taskly-hero": "https://motionsites.ai/assets/hero-taskly-preview-Dq2MKaI0.gif",
  "transform-data-hero": "https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif",
  "velorah-hero": "https://motionsites.ai/assets/hero-velorah-preview-CJNTtbpd.gif",
  "vex-ventures-hero": "https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif",
  "vize-footer": "https://motionsites.ai/assets/footer-vize-poster-BRRRDP-A.png",
  "vortex-studio-hero": "https://motionsites.ai/assets/hero-vortex-studio-preview-BQyvwopD.gif",
};

// Chromium 不原生播放 HLS；Mux 为相同公开素材提供 animated.webp 预览。
const browserCompatibleOverrides = {
  "no-code-waitlist": "https://image.mux.com/iY611PYuZ02AKpIzYB4Q1BMpl7W2O3UwqjQm9p01xlmVg/animated.webp?width=640",
  "visual-hero": "https://image.mux.com/i9kUFJpB6GrWoe2UXRZG4lIP02g00LGulS1GTVrMMwZI00/animated.webp?width=640",
};

function resolvePreview(meta) {
  const previewUrl = browserCompatibleOverrides[meta.id] || meta.preview_url || previewOverrides[meta.id] || "";
  return {
    previewUrl,
    previewType: /\.mp4(?:$|\?)/i.test(previewUrl) ? "video" : "image",
  };
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error("Markdown 缺少 YAML frontmatter");
  const meta = {};
  let activeList = null;
  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && activeList) {
      meta[activeList].push(JSON.parse(listItem[1]));
      continue;
    }
    const pair = line.match(/^([a-z_]+):(?:\s+(.*))?$/);
    if (!pair) continue;
    const [, key, value = ""] = pair;
    if (!value) {
      meta[key] = [];
      activeList = key;
    } else {
      activeList = null;
      if (value === "true" || value === "false") meta[key] = value === "true";
      else meta[key] = JSON.parse(value);
    }
  }
  return { meta, body: raw.slice(match[0].length) };
}

function section(body, title, nextTitle) {
  const start = body.indexOf(`## ${title}`);
  if (start < 0) return "";
  const contentStart = start + `## ${title}`.length;
  const end = nextTitle ? body.indexOf(`## ${nextTitle}`, contentStart) : body.length;
  return body.slice(contentStart, end < 0 ? body.length : end).trim();
}

function promptBlock(body, heading) {
  return body.match(new RegExp("## " + heading + "\\s+```text\\s*([\\s\\S]*?)\\s*```"))?.[1]?.trim() ?? "";
}

const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith(".md")).sort((a, b) => a.localeCompare(b));
const records = [];

for (const file of files) {
  const raw = await fs.readFile(path.join(sourceDir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  if (meta.free !== true) continue;
  const prompt = promptBlock(body, "原创英文提示词");
  const promptZh = promptBlock(body, "原创中文提示词");
  const officialPrompt = promptBlock(body, "官网原文");
  const officialPromptZh = promptBlock(body, "官方原文中文翻译");
  if (!prompt) throw new Error(`${file} 缺少原创英文提示词`);
  if (!promptZh) throw new Error(`${file} 缺少原创中文提示词`);
  if (officialPrompt && !officialPromptZh) throw new Error(`${file} 已收录官网原文但缺少完整中文翻译`);
  const scenario = section(body, "适用场景", officialPrompt ? "官网原文" : "原创英文提示词");
  const preview = resolvePreview(meta);
  records.push({
    id: meta.id,
    title: meta.source_title,
    category: meta.category,
    primaryGroup: meta.primary_group,
    tabs: meta.tabs,
    sourceUrl: meta.source_url,
    ...preview,
    verifiedAt: meta.verified_at,
    summary: section(body, "模板概述", "适用场景"),
    scenario,
    officialPrompt: officialPrompt || null,
    officialPromptZh: officialPromptZh || null,
    officialStatus: officialPrompt ? (meta.official_prompt_status ?? "verified") : "not-imported",
    officialVerifiedAt: officialPrompt ? (meta.official_prompt_verified_at ?? meta.verified_at) : null,
    officialProvenance: officialPrompt ? (meta.official_prompt_provenance ?? "user-provided") : null,
    prompt,
    promptZh,
  });
}

if (records.length !== 147) throw new Error(`预期 147 个免费提示词，实际 ${records.length} 个`);

const output = `export type PromptRecord = {
  id: string;
  title: string;
  category: string;
  primaryGroup: "Sites" | "Apps" | "Sections";
  tabs: string[];
  sourceUrl: string;
  previewUrl: string;
  previewType: "image" | "video";
  verifiedAt: string;
  summary: string;
  scenario: string;
  officialPrompt: string | null;
  officialPromptZh: string | null;
  officialStatus: "user-provided-verified" | "verified" | "not-imported";
  officialVerifiedAt: string | null;
  officialProvenance: string | null;
  prompt: string;
  promptZh: string;
};

export const promptData: PromptRecord[] = ${JSON.stringify(records, null, 2)};
`;

await fs.writeFile(outputFile, output, "utf8");
console.log(`已生成 ${records.length} 个提示词：${outputFile}`);
