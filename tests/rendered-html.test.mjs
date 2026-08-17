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
  assert.equal(ids.length, 147);
  assert.equal(chinesePrompts.length, 147);
  assert.equal(previewUrls.length, 147);
  assert.equal(imagePreviews.length, 135);
  assert.equal(videoPreviews.length, 12);
  assert.match(data, /"primaryGroup": "Sites"/);
  assert.match(data, /"primaryGroup": "Apps"/);
  assert.match(data, /"primaryGroup": "Sections"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("详情支持中英切换、独立滚动和按当前语言复制", async () => {
  const component = await readFile(new URL("../app/prompt-library.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /原创中文提示词/);
  assert.match(component, /language === "zh" \? prompt\.promptZh : prompt\.prompt/);
  assert.match(component, /已显示完整提示词/);
  assert.match(styles, /\.prompt-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.prompt-scroll\.prompt-zh pre/);
});
