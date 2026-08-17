import type { Metadata } from "next";
import { PromptLibrary } from "./prompt-library";
import { promptData } from "./prompt-data";

export const metadata: Metadata = {
  title: "Prompt Atlas — 免费前端提示词库",
  description: "本地浏览 147 个免费前端项目，按官网原文、中文翻译和原创改写分层管理。",
};

export default function Home() {
  return <PromptLibrary prompts={promptData} />;
}
