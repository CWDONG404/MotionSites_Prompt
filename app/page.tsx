import type { Metadata } from "next";
import { PromptLibrary } from "./prompt-library";
import { promptData } from "./prompt-data";

export const metadata: Metadata = {
  title: "Prompt Atlas — 免费前端提示词库",
  description: "本地浏览、筛选和使用 147 个原创前端提示词。",
};

export default function Home() {
  return <PromptLibrary prompts={promptData} />;
}
