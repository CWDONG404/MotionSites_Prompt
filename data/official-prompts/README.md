# 官网 Full Prompt 本地原文库

这个目录是网站“官网原文”层的本地数据入口。只放入你通过 MotionSites 公开 `Copy full prompt` 流程取得、并有权在本机保存的内容。

实际原文文件和生成出的运行时 JSON 默认被 Git 忽略，不会随 `git add .` 上传到 GitHub。仓库只提交本说明与空白模板。

## 单文件格式

复制 `prompt.md.example`，按模板 ID 命名，例如 `ai-trip-planner.md`。`id` 必须与网站 147 项目录中的 ID 一致，`source_url` 必须与对应来源链接一致。

原文必须放在以下标记之间；标记本身不会进入网站正文：

```text
<!-- OFFICIAL_PROMPT_START -->
在这里粘贴官网 Copy full prompt 得到的完整内容
<!-- OFFICIAL_PROMPT_END -->
```

中文翻译可稍后补充：

```text
<!-- OFFICIAL_PROMPT_ZH_START -->
在这里粘贴与官网原文逐项对应的完整中文翻译
<!-- OFFICIAL_PROMPT_ZH_END -->
```

## 批量 JSON 格式

也可以放入一个或多个 `.json` 文件。根节点可以是数组，或使用 `entries` 数组：

```json
{
  "entries": [
    {
      "id": "ai-trip-planner",
      "sourceUrl": "https://motionsites.ai/?prompt=ai-trip-planner",
      "capturedAt": "2026-08-18",
      "provenance": "user-provided-official-copy",
      "officialPrompt": "完整官网原文",
      "officialPromptZh": "可选的完整中文翻译"
    }
  ]
}
```

不要把“原创改写”放进 `officialPrompt`。尚未取得官网原文的 ID 应保持缺失，而不是填写占位文本。

## 同步与验收

```powershell
# 校验本地文件并生成前端运行时数据
npm run sync:official

# 要求 147 份全部齐全；缺少任何一份都会失败
npm run audit:official:complete

# 启动网站；dev 会先自动执行同步
npm run dev
```

同步器会拒绝未知 ID、重复 ID、来源地址错配以及明显为空的正文，并为每份原文记录 SHA-256。网站会在浏览器中把这份本地数据与 147 项目录合并，不会用“原创改写”冒充缺失的官网原文。

同步器只处理你放入此目录的本地内容，不会登录官网、批量抓取或绕过 Copy／付费限制。
