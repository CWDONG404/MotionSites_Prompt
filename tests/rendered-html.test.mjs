import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("服务端输出 Prompt Atlas 首页", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Prompt Atlas — 免费前端提示词库<\/title>/i);
  assert.match(html, /把灵感变成/);
  assert.match(html, /147/);
  assert.match(html, /浏览提示词/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});

test("数据文件包含 147 个免费提示词", async () => {
  const data = await readFile(new URL("../app/prompt-data.ts", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const ids = [...data.matchAll(/^\s+"id":\s/gm)];
  const chinesePrompts = [...data.matchAll(/^\s+"promptZh":\s/gm)];
  const previewUrls = [...data.matchAll(/^\s+"previewUrl":\s+"([^"]+)"/gm)];
  const imagePreviews = [...data.matchAll(/^\s+"previewType":\s+"image"/gm)];
  const videoPreviews = [...data.matchAll(/^\s+"previewType":\s+"video"/gm)];
  const assignment = data.indexOf("= [", data.indexOf("export const promptData"));
  const end = data.lastIndexOf("];");
  const records = JSON.parse(data.slice(assignment + 2, end + 1));
  const tripPlanner = records.find((record) => record.id === "ai-trip-planner");
  assert.equal(ids.length, 147);
  assert.equal(chinesePrompts.length, 147);
  assert.equal(previewUrls.length, 147);
  assert.equal(imagePreviews.length, 135);
  assert.equal(videoPreviews.length, 12);
  assert.equal(records.filter((record) => record.officialPrompt).length, 1);
  assert.equal(tripPlanner.officialPrompt.length, 6398);
  assert.match(tripPlanner.officialPrompt, /Wandor — Where will you go next\?/);
  assert.match(tripPlanner.officialPromptZh, /液态玻璃提示卡片/);
  assert.match(data, /"primaryGroup": "Sites"/);
  assert.match(data, /"primaryGroup": "Apps"/);
  assert.match(data, /"primaryGroup": "Sections"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("详情支持三层内容、本地导入、独立滚动和按当前层复制", async () => {
  const component = await readFile(new URL("../app/prompt-library.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /官网原文/);
  assert.match(component, /中文翻译/);
  assert.match(component, /原创改写/);
  assert.match(component, /localStorage\.setItem\(localOfficialStorageKey/);
  assert.match(component, /handleCopy\(activePromptKey, activePromptText\)/);
  assert.match(component, /暂无可复制内容/);
  assert.match(component, /已显示完整内容/);
  assert.match(styles, /\.prompt-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.prompt-scroll\.prompt-zh pre/);
  assert.match(styles, /\.layer-switch/);
  assert.match(styles, /\.official-import/);
});
