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

function promptBlock(body) {
  return body.match(/## 原创英文提示词\s+```text\s*([\s\S]*?)\s*```/)?.[1]?.trim() ?? "";
}

function lineValue(prompt, label) {
  return prompt.match(new RegExp(`^- ${label}: (.+)$`, "m"))?.[1]?.trim() ?? "";
}

function translateParts(value, translations, separator = ";") {
  return value
    .replace(/\.$/, "")
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => translations[part] ?? part)
    .join("、");
}

const compositionTranslations = {
  "a centered focal composition": "居中的视觉焦点构图",
  "a compact navigation sidebar": "紧凑的侧边导航",
  "a dense but legible dashboard shell": "信息密集但清晰易读的仪表盘框架",
  "a comparison layout with clear plan hierarchy, feature scanning, and an accessible billing switch": "层级清楚、便于扫读功能且包含无障碍计费切换的方案对比布局",
  "a disciplined card grid": "秩序严谨的卡片网格",
  "a feature presentation with clear hierarchy, concise benefits, and visual demonstrations": "层级清楚、利益点精炼并带视觉演示的功能展示",
  "a full-viewport opening composition": "占满首屏的开场构图",
  "a high-impact hero section with navigation, a concise value proposition, primary and secondary actions, and a visual focal point": "包含导航、精炼价值主张、主次操作和视觉焦点的高冲击首屏",
  "a horizontal showcase track": "横向作品展示轨道",
  "a modular bento grid": "模块化 Bento 网格",
  "a responsive masonry rhythm": "响应式瀑布流节奏",
  "a structured footer with brand summary, grouped navigation, utility links, and a concise closing action": "包含品牌摘要、分组导航、实用链接和收束操作的结构化页脚",
  "an asymmetric split layout": "非对称分栏布局",
  "an editorial company story with a concise mission, evidence, and human context": "包含精炼使命、事实依据和人物语境的编辑式品牌故事",
};

const visualTranslations = {
  "bright neutral canvas": "明亮的中性色画布",
  "cinematic depth and lighting": "电影感纵深与光影",
  "contemporary retro references": "当代复古元素",
  "controlled luminous accents": "克制的发光强调",
  "dark high-contrast palette": "深色高对比配色",
  "editorial art direction": "编辑式视觉指导",
  "fine atmospheric grain": "细腻的氛围颗粒",
  "layered frosted-glass surfaces": "有层次的磨砂玻璃表面",
  "monochrome contrast": "单色对比",
  "organic forms and natural rhythm": "有机形态与自然节奏",
  "playful but disciplined visual language": "活泼但有秩序的视觉语言",
  "precise futuristic styling": "精确的未来主义风格",
  "quiet premium detailing": "安静克制的高级细节",
  "restrained minimalist styling": "克制的极简风格",
  "subtle directional gradients": "细微的方向性渐变",
};

const motionTranslations = {
  "a continuously looping marquee": "连续循环的跑马灯",
  "a restrained pointer-following effect": "克制的指针跟随效果",
  "animated accordion expansion": "手风琴展开动画",
  "animated tab switching": "标签页切换动画",
  "keyboard-accessible carousel motion": "支持键盘操作的轮播动画",
  "lightweight 3D-inspired depth": "轻量的 3D 景深效果",
  "masked content reveals": "遮罩式内容揭示",
  "purposeful hover feedback": "有明确意图的悬停反馈",
  "scroll-linked progression": "与滚动进度联动的动画",
  "slow ambient floating motion": "缓慢的环境漂浮动画",
  "staggered entrance transitions": "错峰入场过渡",
  "sticky sectional storytelling": "粘性分段叙事",
  "subtle multi-layer parallax": "细微的多层视差",
};

const contentTranslations = {
  "a compact evidence section that gives each metric context instead of showing decorative numbers": "紧凑的证据模块；每个指标都要提供语境，不能只展示装饰性数字",
  "a comparison layout with clear plan hierarchy, feature scanning, and an accessible billing switch": "层级清楚、便于扫读功能并带无障碍计费切换的方案对比",
  "a complete landing page with a focused hero, trust evidence, benefits, product proof, conversion section, and footer": "完整落地页，包含聚焦的首屏、信任证据、利益点、产品证明、转化区和页脚",
  "a feature presentation with clear hierarchy, concise benefits, and visual demonstrations": "层级清楚、利益点精炼并带视觉演示的功能展示",
  "a focused conversion block with one dominant message, supporting proof, and a single primary action": "聚焦的转化模块，包含一个主信息、支持证据和单一主操作",
  "a high-impact hero section with navigation, a concise value proposition, primary and secondary actions, and a visual focal point": "高冲击首屏，包含导航、精炼价值主张、主次操作和视觉焦点",
  "a memorable not-found state with a clear recovery path": "具有记忆点且提供清晰恢复路径的未找到状态",
  "a proof-focused testimonial composition with readable quotes and explicit controls": "以证据为核心、引文清晰且控件明确的用户评价模块",
  "a responsive application shell with clear navigation and task-focused content regions": "带清晰导航和任务导向内容区的响应式应用框架",
  "a responsive editorial feed with a lead story and scannable secondary articles": "包含头条和易扫读次级文章的响应式编辑内容流",
  "a reusable marketing section with one clear purpose and disciplined content hierarchy": "目标单一、内容层级严谨的可复用营销模块",
  "a structured footer with brand summary, grouped navigation, utility links, and a concise closing action": "包含品牌摘要、分组导航、实用链接和收束操作的结构化页脚",
  "an editorial company story with a concise mission, evidence, and human context": "包含精炼使命、事实依据和人物语境的编辑式公司故事",
};

function buildChinesePrompt({ meta, prompt, scenario }) {
  const composition = translateParts(lineValue(prompt, "Primary composition"), compositionTranslations);
  const visual = translateParts(lineValue(prompt, "Visual language"), visualTranslations);
  const palette = lineValue(prompt, "Suggested palette").replace(/\. Treat these[\s\S]*$/, "");
  const typography = lineValue(prompt, "Typography")
    .replace(/\. Maintain a clear display\/body\/UI hierarchy\.$/, "")
    .replace("a clean humanist sans-serif with tabular numerals", "带等宽数字的人文无衬线字体")
    .replace("a geometric sans-serif with a restrained monospace accent", "几何无衬线字体，辅以克制的等宽字体")
    .replace("a high-contrast display face paired with a neutral UI sans-serif", "高对比展示字体搭配中性的 UI 无衬线字体")
    .replace("a modern grotesk with an editorial serif accent", "现代 Grotesk 字体，辅以编辑感衬线字体");
  const spacing = prompt.match(/^- Use a (.+?) spacing rhythm, a maximum content width of (\d+px), and a base surface radius around (\d+px)\.$/m);
  const spacingLabel = {
    "compact but breathable": "紧凑但有呼吸感",
    "editorially paced": "具有编辑节奏",
    "highly structured": "高度结构化",
    spacious: "宽松",
  }[spacing?.[1] ?? ""] ?? spacing?.[1] ?? "清晰";
  const motionRaw = prompt.match(/^- Use (.+) as the primary motion vocabulary\.$/m)?.[1] ?? "purposeful hover feedback";
  const motion = translateParts(motionRaw, motionTranslations, ",");
  const contentRaw = prompt.match(/CONTENT AND STRUCTURE\n- (.+)$/m)?.[1]?.replace(/\.$/, "") ?? "";
  const content = contentTranslations[contentRaw] ?? contentRaw;
  const duration = prompt.match(/Keep ordinary transitions within (\d+–\d+ms)/)?.[1] ?? "220–320ms";

  return `请为一个虚构的「${meta.category}」项目构建原创、可用于生产环境的前端方案。必须从零实现，不得在文字或视觉上复刻任何现有品牌。

技术栈
- React 19 + TypeScript + Vite。
- 使用 Tailwind CSS v4 完成样式与响应式布局。
- 使用 motion/react 实现有意义的界面动画。
- 界面图标使用 lucide-react；不要把 emoji 当作功能图标。
- 仅实现前端。除非可见界面明确需要，否则不要添加登录、数据库、分析、支付或外部服务。

设计方向
- 主体构图：${composition}。
- 视觉语言：${visual}。
- 建议配色：${palette}。把它们作为设计令牌；无障碍对比度不达标时允许调整。
- 字体：${typography}。建立清楚的展示文字、正文和 UI 层级。
- 使用${spacingLabel}的间距节奏，内容最大宽度 ${spacing?.[2] ?? "1280px"}，基础表面圆角约 ${spacing?.[3] ?? "16px"}。
- 避免通用渐变光斑、装饰性图标矩阵、过量玻璃面板，以及不能强化信息层级的随机动画。

内容与结构
- 目标结构：${content}。
- 适用场景：${scenario}
- 创建原创的虚构品牌和精炼、结果导向的文案，让页面从第一印象到最终操作形成连贯叙事。
- 所有名称、数据、主张、价格和评价都必须是中性、虚构且易替换的；不要伪造客户徽标、实时计数或无法证明的性能结果。
- 使用语义化 HTML 地标；即使没有 CSS，文档层级也应清楚可理解。

交互与动画
- 主要动态语言：${motion}。
- 常规过渡控制在 ${duration}；更长动画只用于有意设计的场景切换。
- 优先动画 opacity 和 transform，避免触发布局抖动的属性；不要让持续动画干扰阅读。
- 支持 prefers-reduced-motion，并提供稳定的无动画状态。
- 每个交互控件都必须支持键盘操作并具有清晰可见的焦点样式。

响应式规则
- 分别为 360px 手机、768px 平板、1280px 桌面和宽屏做有意识的设计。
- 手机端保留核心信息与主操作，将复杂区域纵向堆叠，减少装饰层，禁止横向溢出。
- 触控目标至少 44px；正文在条件允许时不小于 16px；控制行长以保证可读性。
- 媒体必须使用响应式尺寸和正确宽高比；首屏以下延迟加载，并提供优雅的失败回退。

无障碍与质量
- 文字和控件达到 WCAG AA 对比度。
- 纯图标控件必须有可访问名称；表单使用正确标签；有意义的图片提供描述性替代文本。
- 不要只依赖颜色表达状态；根据界面需要提供 hover、focus、active、disabled、loading、empty 和 error 状态。
- 复用带类型的组件与共享设计令牌，避免重复布局代码和不必要的依赖。
- 完成页面不得出现控制台错误、失效链接、内容裁切或意外的页面级横向滚动。

交付要求
- 返回完整、可运行的 Vite 项目，并保持清晰的组件边界。
- 提供简短 README，说明安装与启动命令。
- 交付前在 360px、768px 和 1440px 宽度下检查布局，并确认键盘导航与减少动态效果模式正常。`;
}

const files = (await fs.readdir(sourceDir))
  .filter((name) => name.endsWith(".md"))
  .sort((a, b) => a.localeCompare(b));

const records = [];
for (const file of files) {
  const raw = await fs.readFile(path.join(sourceDir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  if (meta.free !== true) continue;
  const prompt = promptBlock(body);
  if (!prompt) throw new Error(`${file} 缺少原创英文提示词`);
  const scenario = section(body, "适用场景", "原创英文提示词");
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
    prompt,
    promptZh: buildChinesePrompt({ meta, prompt, scenario }),
  });
}

if (records.length !== 147) {
  throw new Error(`预期 147 个免费提示词，实际 ${records.length} 个`);
}

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
  prompt: string;
  promptZh: string;
};

export const promptData: PromptRecord[] = ${JSON.stringify(records, null, 2)};
`;

await fs.writeFile(outputFile, output, "utf8");
console.log(`已生成 ${records.length} 个提示词：${outputFile}`);
