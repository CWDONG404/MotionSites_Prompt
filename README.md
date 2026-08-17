# MotionSites_Prompt

**Prompt Atlas · 免费前端提示词库**

一个本地优先的前端提示词检索网站，内置 147 份原创中英文等效提示词。项目支持 18 个来源 Tab、全文搜索、分类筛选、中英双语详情、完整长文本滚动与一键复制。

![Prompt Atlas 桌面首页](docs/screenshots/01-home-desktop.png)

## 项目概览

| 项目 | 当前内容 |
| --- | --- |
| 免费提示词 | 147 份，按唯一 ID 去重 |
| 来源分类 | 18 个 MotionSites 页面 Tab |
| 可预览媒体 | 135 个图片或 GIF、12 个 MP4 |
| 提示词语言 | 英文原创建议 + 中文等效版本 |
| 运行方式 | 本地 React 前端，无登录、无数据库 |
| 核验日期 | 2026-08-17 |

## 项目截图

以下截图均来自本项目在本地运行时的真实界面。

<table>
  <tr>
    <td><img src="docs/screenshots/02-library-desktop.png" alt="桌面端提示词资料库与筛选结果"></td>
    <td><img src="docs/screenshots/03-prompt-detail-en.png" alt="桌面端英文提示词详情"></td>
  </tr>
  <tr>
    <td align="center">桌面端资料库</td>
    <td align="center">英文提示词详情</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/04-prompt-detail-zh.png" alt="桌面端中文提示词详情"></td>
    <td><img src="docs/screenshots/01-home-desktop.png" alt="桌面端首页与分类导航"></td>
  </tr>
  <tr>
    <td align="center">中文提示词详情</td>
    <td align="center">桌面端首页</td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/05-mobile-home.png" width="320" alt="390 像素宽移动端首页">
  &nbsp;&nbsp;
  <img src="docs/screenshots/06-mobile-detail.png" width="320" alt="390 像素宽移动端中文详情">
</p>

<p align="center">390 px 移动端首页与中文详情</p>

## 主要功能

- 收录 147 个公开免费项目，不包含 Premium、付费解锁或模板商店内容。
- 每个 ID 都有独立产品画像；页面目标、核心组件、信息结构、交互编排和响应式转化不再只靠统一模板替换少量字段。
- 提供 18 个来源 Tab 和“全部提示词”入口，支持搜索、排序与分批加载。
- 搜索范围覆盖标题、分类、中文概述及中英文提示词正文。
- 详情弹窗支持独立下拉滚动、明确的全文结束标记，并适配桌面和移动端。
- 英文与中文版本一键切换；复制按钮始终复制当前语言的完整正文，并提供成功或失败反馈。
- 支持 `/` 聚焦搜索、`Esc` 关闭详情、键盘焦点和减少动态效果偏好。
- 所有条目均配置预览媒体；图片、GIF 与视频按媒体类型正确渲染，资源不可用时显示清晰的中文状态。

## 快速开始

环境要求：Node.js 22.13 或更高版本。

```powershell
git clone git@github.com:CWDONG404/MotionSites_Prompt.git
cd MotionSites_Prompt
npm ci
npm run dev
```

终端会显示本地地址，通常为 `http://localhost:5173/`；若端口已被占用，开发服务器会自动选择下一个端口。

## 常用命令

```powershell
# 启动本地开发站点
npm run dev

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 构建并运行数据与页面测试
npm test

# 单独检查数量、必填要求和正文重复度
npm run audit:prompts
```

### 维护者数据命令

正常克隆、运行和构建不需要原始 Markdown 资料库；147 条中英文数据已提交在 `app/prompt-data.ts`。

维护者如需从采集资料重新生成数据，可把资料库放在相邻目录后运行：

```powershell
npm run prepare:data
```

如需依据已核验视觉特征和逐条产品画像重建 147 份中英文正文，再同步到前端数据：

```powershell
npm run rewrite:prompts
```

默认读取路径为 `../motionsites-free-prompts-2026-08-17/prompts/`。也可以设置 `MOTIONSITES_PROMPT_SOURCE` 指向其他资料目录，再执行生成命令。

## 技术栈

- React 19 + TypeScript
- Vite / vinext
- Tailwind CSS v4
- lucide-react
- Node.js 内置测试运行器

## 数据与预览资源

提示词库以 2026-08-17 可公开访问的 [MotionSites](https://motionsites.ai/) 首页及 Sections 页面为核验范围。初始数据中缺失的 34 个公开预览已从对应来源页补回；两个不适合直接作为卡片媒体播放的 HLS 地址改用了同一公开素材的 Mux WebP 预览。

预览媒体由第三方来源远程托管，运行时需要联网。若来源日后更换或撤下资源，界面会显示加载失败状态，但本地提示词正文仍可搜索、阅读和复制。

## 核验结果

- 147 个提示词 ID 唯一，中英文正文完整，Markdown 与前端数据错配为 0。
- 反模板化门禁：高频模板行中位占比由 V1 的 73.8% 降至中英文各 12.5%。
- 正文平均相似度：英文 24.5%、中文 9.1%；测试会在重复度回升时直接失败。
- 18 个 Tab 索引全部覆盖；无免费项目的分类保留为空状态。
- 147 个预览地址均已配置，前端分别处理图片、GIF 与视频。
- 桌面端与 390 px 移动端已完成视觉检查。
- 长提示词可滚动至全文末尾，中英切换与当前语言复制流程已验证。
- 构建、静态检查与自动化测试在提交前执行。

## 归属与使用边界

本仓库是独立的非官方项目，与 MotionSites 及其运营方不存在隶属、授权或合作关系。

- 提示词正文是依据公开预览、分类与交互特征编写的原创等效提示词，不是 MotionSites 站内提示词原文。
- 本项目不包含 Premium 内容，也不绕过登录、积分、复制次数或付费解锁限制。
- 第三方名称、商标和预览媒体的权利归各自权利人所有；这些媒体不属于本仓库的授权范围。
- GitHub 仅托管项目源码与原创提示词数据；应用默认在用户本地运行。

## 许可说明

本仓库当前未声明开源许可证。除非另有说明，项目代码与原创提示词保留所有权利；第三方预览媒体不属于本仓库的许可范围。
