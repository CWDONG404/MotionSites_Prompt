import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const sourceDir = process.env.MOTIONSITES_PROMPT_SOURCE
  ? path.resolve(process.env.MOTIONSITES_PROMPT_SOURCE)
  : path.resolve(projectRoot, "..", "motionsites-free-prompts-2026-08-17", "prompts");

// 每条画像只描述该模板独有的产品任务和界面焦点；视觉令牌继续从已核验的公开预览特征读取。
// 中英文画像一一对应，避免再通过统一中文模板制造“翻译后看起来都一样”的问题。
const profiles = {
  "3d-collectible-hero": ["a designer-toy release built around a rotatable figurine, edition chips, material callouts, and a collector waitlist", "围绕可旋转设计师玩偶、版本标签、材质标注和收藏候补名单展开的潮玩发布页"],
  "3d-jack-portfolio-hero": ["a character artist portfolio where an oversized 3D portrait, project reel, model-turnaround view, and contact invitation lead the narrative", "以超大 3D 人物肖像、项目短片、模型环视和合作邀请为叙事主线的角色艺术家作品集"],
  "404-planet": ["a space-themed not-found experience with a stranded explorer, orbital wayfinding, destination shortcuts, and a clear route home", "包含迷航探索者、轨道式导引、目的地捷径和明确返回入口的太空主题 404 页面"],
  "404": ["a typography-led not-found page with a giant status code, concise explanation, search shortcut, and directional recovery links", "以巨型状态码、简短解释、搜索捷径和方向性恢复链接为核心的字体型 404 页面"],
  "adhd-planner": ["a focus planner that organizes Now, Next, and Later tasks beside a visual timer, energy check-in, and low-friction progress review", "把当前、下一步和稍后任务与可视计时器、精力签到和低负担进度复盘结合的专注计划器"],
  "aethera-hero": ["an independent creative studio introduction with floating work fragments, an editorial manifesto, service cues, and a direct project inquiry", "通过漂浮作品片段、编辑式宣言、服务线索和直接项目咨询展现的独立创意工作室首屏"],
  "aetheris-voyage-hero": ["a premium expedition launch featuring a cinematic destination, compact itinerary preview, departure selector, and booking conversation", "突出电影感目的地、精简行程预览、出发日期选择和预订咨询的高端远征首屏"],
  "agent-grove": ["an AI workforce platform showing specialist agent profiles, delegated tasks, proof messages, and a start-building call to action", "展示专业智能体档案、已委派任务、成果消息和开始搭建入口的 AI 劳动力平台"],
  "ai-image-generator-ui": ["an image-generation workspace with a prompt composer, style presets, parameter controls, generation history, and a compare-ready result gallery", "包含提示词编辑器、风格预设、参数控制、生成历史和可对比结果画廊的 AI 图像工作台"],
  "ai-runtime": ["a developer runtime product that pairs an executable code sample with latency telemetry, model routing status, usage limits, and API onboarding", "把可执行代码示例、延迟遥测、模型路由状态、用量限制和 API 接入组合起来的开发者运行时产品"],
  "ai-trip-planner": ["a conversational trip planner that turns preferences into a map-linked day plan, editable stops, budget signals, and a saved itinerary", "把偏好转成地图联动日程、可编辑站点、预算提示和已保存行程的对话式旅行规划器"],
  "ai-workflow-agents": ["a multi-agent automation page centered on an orchestration canvas, role cards, handoff states, run history, and measurable outcomes", "围绕编排画布、角色卡片、交接状态、运行记录和可量化结果展开的多智能体自动化页面"],
  "ai-workflow": ["a workflow builder hero where connected automation nodes, trigger details, live run feedback, and a template entry point explain the product", "用相连自动化节点、触发器细节、实时运行反馈和模板入口说明产品的工作流构建首屏"],
  "animated-cards": ["a reusable card playground demonstrating layered stacking, expansion, reordering, keyboard selection, and content-rich hover states", "演示分层堆叠、展开、重排、键盘选择和信息型悬停状态的可复用卡片组件"],
  "arceage-stats": ["a competitive game-statistics panel with player ranking, season progress, combat breakdowns, comparative charts, and match history", "包含玩家排名、赛季进度、战斗拆分、对比图表和比赛记录的竞技游戏数据面板"],
  "asme-hero": ["an engineering collective hero combining a precise mission statement, technical artifact gallery, discipline index, and collaboration entry point", "把精确使命陈述、技术成果画廊、专业领域索引和协作入口结合起来的工程团队首屏"],
  "audio-showcase": ["an audio release showcase with a tactile player, waveform scrubber, track sequence, listening notes, and platform links", "包含可触控播放器、波形拖动、曲目顺序、聆听笔记和平台链接的音频发布展示"],
  "aurora-onboard": ["a calm account-onboarding flow with progressive fields, password guidance, social sign-in alternatives, consent copy, and completion feedback", "包含渐进字段、密码指导、第三方登录替代、授权文案和完成反馈的平静账户注册流程"],
  "autonomous-ops": ["a compact autonomous-operations feature section contrasting instant visibility, automated workflows, and decision support through three evidence-led modules", "通过三个证据导向模块对比即时可见性、自动化工作流和决策支持的自主运营功能区"],
  "axion-about": ["a technology-company story that connects a concise mission, founding timeline, operating principles, team portraits, and evidence of progress", "把精炼使命、创立时间线、行动原则、团队人物和进展证据连成一体的科技公司故事页"],
  "beauty-categories": ["a beauty catalog navigator with skin, hair, fragrance, and body categories, editorial imagery, product counts, and tactile hover discovery", "用护肤、护发、香氛和身体护理分类、编辑图片、商品数量和触感悬停完成探索的美妆目录导航"],
  "blog-showcase": ["an editorial story feed with one dominant feature, topic filters, scannable secondary articles, author context, and newsletter capture", "包含主打文章、主题筛选、易扫读次级内容、作者信息和订阅入口的编辑式内容流"],
  "bloom-ai-hero": ["a generative assistant hero that stages a prompt, an evolving output preview, capability suggestions, trust notes, and an immediate try-it action", "通过提示输入、演化中的输出预览、能力建议、信任说明和立即体验入口呈现的生成式助手首屏"],
  "bold-studio": ["a high-energy design studio opener using kinetic typography, a compact work reel, capability labels, and an unapologetic project invitation", "使用动态字体、精简作品短片、能力标签和鲜明项目邀请的高能设计工作室开场"],
  "build-with-us": ["a project-inquiry section combining a decisive invitation, scoped contact form, service selector, response expectation, and studio details", "把明确邀请、范围化联系表单、服务选择、回复预期和工作室信息组合起来的项目咨询区"],
  "celestial-renewal": ["a restorative wellness program framed through celestial rituals, session pathways, practitioner reassurance, schedule options, and a gentle booking action", "通过星象仪式、疗程路径、从业者信任信息、时间选择和温和预约入口呈现的身心修复项目"],
  "church-community": ["a community church home with upcoming gatherings, sermon highlights, support groups, volunteer paths, and a welcoming first-visit guide", "包含近期聚会、讲道精选、支持小组、志愿路径和首次到访指南的社区教会主页"],
  "codenest-hero": ["a coding-learning platform that pairs an interactive editor preview with course tracks, learner progress, mentor support, and a start-coding action", "把交互代码编辑器预览、课程路径、学习进度、导师支持和开始编程入口结合起来的编程学习平台"],
  "coffee-rewards": ["a café loyalty app with a digital stamp card, point balance, next reward preview, nearby order shortcut, and redemption history", "包含电子集章卡、积分余额、下一奖励预览、附近下单捷径和兑换记录的咖啡会员应用"],
  "cognitra-feature": ["an AI reasoning feature explanation built around input context, an interpretable processing sequence, confidence signals, and an actionable output", "围绕输入语境、可解释处理步骤、置信提示和可执行输出展开的 AI 推理功能说明"],
  "contact-cybernetic": ["a cybernetic contact experience with terminal-inspired fields, inquiry routing, availability status, secure-channel options, and immediate confirmation", "包含终端风格字段、咨询分流、可用状态、安全渠道选择和即时确认的赛博联系体验"],
  "convix-software-hero": ["a business-software hero that connects a concise promise to a live dashboard preview, workflow benefits, proof points, and a product-demo action", "把精炼承诺、实时仪表盘预览、工作流收益、证明信息和产品演示入口连起来的企业软件首屏"],
  "cozypaws": ["a warm pet-care landing experience with service choices, trusted caregiver profiles, a pet-friendly booking path, and reassuring owner stories", "包含服务选择、可信照护者档案、宠物友好预约路径和主人故事的温暖宠物照护页面"],
  "creative-portfolio": ["a multidisciplinary designer portfolio led by one featured project, compact project thumbnails, role and discipline labels, and a personal contact note", "以一个重点项目、精简作品缩略图、角色与专业标签和个人联系说明为主的跨领域设计师作品集"],
  "creative-studio": ["a creative agency site that moves from a sharp positioning statement into selected cases, service modules, working principles, and a project brief", "从鲜明定位进入精选案例、服务模块、合作原则和项目需求表的创意机构网站"],
  "cross-border": ["a cross-border freight service with route visualization, shipment milestones, customs reassurance, quote inputs, and operations proof", "包含路线可视化、运输里程碑、清关保障、报价输入和运营证明的跨境货运服务页"],
  "cyber-layer": ["a security architecture explainer that reveals layered defenses, protected assets, threat paths, coverage gaps, and a technical assessment action", "逐层揭示防御体系、受保护资产、威胁路径、覆盖缺口和技术评估入口的安全架构说明"],
  "cybersecurity-hero": ["a threat-protection hero with a live monitoring surface, incident priority, coverage metrics, response workflow, and a security-review call to action", "包含实时监控界面、事件优先级、覆盖指标、响应流程和安全评审入口的威胁防护首屏"],
  "daisy-wild": ["a botanical product launch centered on a tactile hero object, ingredient story, scent or material notes, variant selection, and purchase action", "围绕具有触感的主产品、成分故事、香气或材质说明、规格选择和购买操作展开的植物系产品发布页"],
  "data-signal": ["an analytics product that turns noisy streams into prioritized signals through trend charts, anomaly cards, filters, and decision-ready summaries", "通过趋势图、异常卡片、筛选器和决策摘要把嘈杂数据流转成优先信号的分析产品"],
  "datacore-booking-hero": ["a scheduling platform with service selection, calendar availability, attendee details, confirmation states, and an operator-side booking overview", "包含服务选择、日历空档、参与者信息、确认状态和运营端预约总览的排程平台"],
  "deepthink": ["a research assistant workspace with a focused question composer, transparent reasoning steps, cited evidence, follow-up prompts, and export controls", "包含聚焦问题编辑器、透明推理步骤、引用证据、追问建议和导出控制的研究助手工作台"],
  "design-rocket-email-hero": ["an email-campaign builder showing an editable message, audience targeting, automation sequence, inbox preview, and launch readiness", "展示可编辑邮件、受众定位、自动化序列、收件箱预览和发布准备状态的邮件营销构建器"],
  "designpro-hero": ["a design academy hero with course pathways, an active lesson preview, portfolio outcomes, mentor credibility, and enrollment action", "包含课程路径、进行中课节预览、作品成果、导师可信度和报名入口的设计学院首屏"],
  "digital-director": ["a film and digital director portfolio with a cinematic showreel, project credits, genre filters, behind-the-scenes notes, and representation contact", "包含电影感作品短片、项目职员表、类型筛选、幕后说明和代理联系信息的影视数字导演作品集"],
  "digital-epoch-hero": ["a future-facing digital publication opener with a provocative thesis, visual timeline, issue highlights, contributor context, and reading entry point", "包含前瞻论点、可视时间线、期刊亮点、撰稿人信息和阅读入口的未来数字出版首屏"],
  "digital-experiences": ["an experiential design studio landing page that sequences immersive case studies, capability proof, process snapshots, and a new-business conversation", "依次呈现沉浸式案例、能力证明、流程片段和新业务咨询的体验设计工作室落地页"],
  "digitwist-hero": ["an AI site-builder hero that turns a written brief into a page preview, editable sections, theme controls, and a publish-ready checklist", "把文字需求转换成页面预览、可编辑区块、主题控制和发布检查表的 AI 建站工具首屏"],
  "dot-hero": ["a minimal identity experiment where a single interactive dot becomes navigation, progress, product metaphor, and the trigger for revealing content", "让单个交互圆点同时承担导航、进度、产品隐喻和内容揭示触发器的极简品牌实验"],
  "duolingo-styleguide-hero": ["a playful brand-system explorer with color tokens, character states, typography samples, component examples, and copyable usage guidance", "包含色彩令牌、角色状态、字体样例、组件示例和可复制使用规范的趣味品牌系统浏览器"],
  "email-landing-page": ["an email productivity landing page with an organized inbox preview, triage workflow, smart composition cues, integration proof, and signup path", "包含有序收件箱预览、分拣流程、智能撰写提示、集成证明和注册路径的邮件效率产品落地页"],
  "equilibrium": ["a balance-driven concept page that contrasts two complementary states through a split composition, shared focal object, value explanation, and decisive transition", "通过分栏构图、共享焦点物、价值解释和明确转换对比两种互补状态的平衡主题概念页"],
  "f1-racing-hub": ["a motorsport statistics app combining live timing, driver standings, lap comparison, circuit context, and race-by-race history", "把实时计时、车手排名、圈速对比、赛道信息和逐场历史结合起来的赛车数据应用"],
  "faq-cta": ["a conversion-focused FAQ block with grouped questions, animated answers, persistent reassurance, escalation contact, and one final action", "包含分组问题、动画答案、持续信任说明、升级联系和单一最终操作的转化型常见问题模块"],
  "forecast-center": ["a weather intelligence dashboard with current conditions, layered map, hourly trend, severe alerts, saved locations, and planning guidance", "包含当前天气、分层地图、逐小时趋势、恶劣预警、收藏地点和规划建议的天气情报仪表盘"],
  "fun-404-page": ["a playful education-themed not-found page with an illustrated mishap, mini learning prompt, class shortcuts, and a friendly route back", "包含插画式意外、迷你学习提示、课程捷径和友好返回路径的教育主题 404 页面"],
  "glow-features": ["a luminous product-feature cluster where three capabilities emerge from a central glow, each with concise proof and an interactive demonstration", "让三项能力从中心光源展开、各自配有精炼证明和交互演示的发光产品功能组"],
  "growth-decisions": ["a decision-intelligence hero that frames a better business question beside terrain-like forecasts, scenario controls, and outcome comparisons", "把更好的业务问题与地形化预测、情景控制和结果对比并置的决策智能首屏"],
  "guardnet-benefits": ["a security-benefits section mapping protected surfaces, proactive controls, response speed, and operational confidence to tangible outcomes", "把受保护范围、主动控制、响应速度和运营信心映射到具体结果的安全收益模块"],
  "halo-usd-landing": ["a digital-dollar landing page with balance and transfer preview, reserve explanation, cross-border use cases, fee clarity, and onboarding", "包含余额与转账预览、储备说明、跨境用例、费用透明度和接入流程的数字美元落地页"],
  "halo-use-case": ["a focused use-case module that follows one user from initial friction through product steps, measurable change, evidence, and next action", "跟随一个用户从初始阻碍经过产品步骤、可量化变化和证据到下一操作的聚焦用例模块"],
  "haul-footer": ["an oversized retail footer combining a bold closing statement, shopping categories, support links, regional controls, newsletter capture, and social destinations", "把醒目收束语、购物分类、支持链接、地区控制、邮件订阅和社交入口结合起来的超大零售页脚"],
  "health-portal": ["a patient portal with appointment status, test results, care-team messages, medication reminders, and a clearly prioritized next step", "包含预约状态、检查结果、医护消息、用药提醒和明确下一步的患者门户"],
  "immersive-ocean": ["an ocean-story hero that uses depth, drifting species, conservation facts, expedition chapters, and an explore-or-support decision", "通过纵深、漂游物种、保护事实、探索章节和了解或支持选择展开的海洋叙事首屏"],
  "impact-ventures": ["an impact investment site connecting a fund thesis to portfolio ventures, measurable outcomes, sector filters, founder stories, and partnership inquiry", "把基金论点、投资组合、可量化成果、行业筛选、创始人故事和合作咨询连接起来的影响力投资网站"],
  "innovation-lab": ["a research lab index with active experiments, technology themes, prototype evidence, researcher profiles, and a proposal submission path", "包含进行中实验、技术主题、原型证据、研究者档案和提案提交路径的研发实验室索引"],
  "innovation-landing": ["an innovation consultancy landing page built around a future-state claim, transformation cases, workshop formats, operating model, and discovery call", "围绕未来状态主张、转型案例、工作坊形式、运营模型和探索会议构建的创新咨询落地页"],
  "intelligence-layer": ["a data-infrastructure explainer showing source ingestion, intelligence processing, governed outputs, system integrations, and observability", "展示数据源接入、智能处理、受治理输出、系统集成和可观测性的资料基础设施说明页"],
  "intelligent-operations": ["an operations consultancy page that links process diagnostics, automation opportunities, delivery phases, proof metrics, and an assessment request", "把流程诊断、自动化机会、交付阶段、证明指标和评估申请连接起来的智能运营咨询页"],
  "intelligentx": ["an enterprise intelligence hero with a question-to-insight flow, connected data sources, decision cards, governance reassurance, and product access", "包含从提问到洞察流程、相连数据源、决策卡片、治理保障和产品入口的企业智能首屏"],
  "interactive-discovery": ["an exploratory product story that asks a short preference question, changes the visual scene, reveals a tailored path, and records progress", "通过简短偏好问题改变视觉场景、揭示定制路径并记录进度的探索式产品故事"],
  "kresna-footer": ["a creative-company footer with an expressive closing line, selected contact routes, office context, compact sitemap, and a tactile availability indicator", "包含富有表现力的收束语、精选联系路径、办公地点、精简站点地图和可触控档期指示的创意公司页脚"],
  "launchex-about": ["a launch-specialist company story with origin narrative, milestone sequence, operating principles, team expertise, and evidence of shipped work", "包含起源叙事、里程碑序列、行动原则、团队专长和已交付作品证据的发布专家公司故事"],
  "liquid-glass-cta": ["a single translucent conversion card where layered refraction, concise value copy, supporting proof, and one magnetic action form the entire section", "以分层折射、精炼价值文案、支持证据和单一磁性操作构成的透明转化卡片"],
  "lumina-footer": ["a light-led minimal footer with a calm sign-off, newsletter field, essential navigation, legal utilities, and a restrained social row", "包含平静落款、订阅字段、必要导航、法律工具和克制社交链接的光感极简页脚"],
  "luminex-hero": ["a luminous technology-product hero with a glowing device or interface, concise promise, capability markers, proof statistic, and demo request", "包含发光设备或界面、精炼承诺、能力标记、证明数据和演示申请的光感科技产品首屏"],
  "max-reed-portfolio": ["a portfolio feature sequence that pairs large project imagery with role details, problem-and-outcome notes, navigation progress, and case-study entry", "把大型项目图像、角色信息、问题与结果说明、导航进度和案例入口配对的作品集功能序列"],
  "mind-body-healing": ["a therapeutic practice page with treatment pathways, practitioner introduction, session expectations, grounded testimonials, and booking choices", "包含治疗路径、从业者介绍、疗程预期、可信评价和预约选择的身心疗愈实践页"],
  "mindloop-landing": ["a mental-wellness companion landing page with daily check-in, guided loop preview, reflection history, privacy reassurance, and gentle onboarding", "包含每日签到、引导循环预览、反思记录、隐私保障和温和接入的心理健康陪伴产品落地页"],
  "modern-agency": ["a contemporary agency page that moves from a decisive point of view to selected work, service packages, working method, team signal, and inquiry", "从明确观点进入精选作品、服务方案、工作方法、团队信号和咨询入口的现代机构页面"],
  "mostar-guide": ["a city guide for Mostar with a map-first landmark index, neighborhood stories, saved route, practical trip notes, and local recommendations", "以地图优先地标索引、街区故事、收藏路线、实用旅行说明和本地推荐组成的莫斯塔尔城市指南"],
  "neo-museum": ["a digital museum experience with a featured exhibit, collection rooms, artifact metadata, curatorial narrative, and exploratory navigation", "包含主打展览、藏品展厅、文物元数据、策展叙事和探索式导航的数字博物馆体验"],
  "neon-logic": ["a neon developer-tool landing page with a code-led promise, terminal demonstration, capability sequence, performance proof, and install action", "包含代码主导承诺、终端演示、能力序列、性能证明和安装操作的霓虹开发工具落地页"],
  "network-hero": ["a network-platform hero where animated nodes explain connection health, regional reach, traffic flow, resilience, and a live-map action", "通过动画节点说明连接健康、区域覆盖、流量走向、韧性和实时地图入口的网络平台首屏"],
  "neuralyn-hero": ["a neural analytics product showing data intake, model processing, explainable findings, confidence levels, and a guided first analysis", "展示数据导入、模型处理、可解释发现、置信水平和首次引导分析的神经分析产品"],
  "nexacore-control": ["an operations-control feature with command center preview, permission-aware actions, automation toggles, incident states, and audit trace", "包含指挥中心预览、权限感知操作、自动化开关、事件状态和审计轨迹的运营控制功能"],
  "nexacore-results": ["a results section that connects before-and-after operational metrics, a concise case timeline, attributed evidence, and the next optimization step", "把运营前后指标、精简案例时间线、具名证据和下一优化步骤连接起来的结果模块"],
  "nexora-hero": ["an automation platform hero with trigger-to-action workflow, connected app tiles, run status, time-saved evidence, and template launch", "包含从触发到操作流程、应用连接卡片、运行状态、节省时间证据和模板启动入口的自动化平台首屏"],
  "nike-hover": ["a neutral performance-footwear feature card with product angle shift, material hotspots, color selection, size feedback, and add-to-bag action", "包含产品角度切换、材质热点、颜色选择、尺码反馈和加入购物袋操作的中性运动鞋功能卡"],
  "no-code-waitlist": ["a no-code product waitlist with a concise product teaser, animated builder preview, role-based benefit, email capture, and transparent launch status", "包含精炼产品预告、动态构建器预览、角色收益、邮箱收集和透明发布状态的无代码产品候补页"],
  "orbis-hello": ["a friendly company introduction with a human greeting, small team portraits, shared principles, current focus, and an invitation to connect", "包含亲切问候、小型团队人物、共同原则、当前重点和联系邀请的友好公司介绍"],
  "orbis-nft-landing": ["a digital-collectible marketplace with featured artwork, collection floor data, creator context, ownership details, and wallet-ready browsing", "包含主打数字艺术、藏品底价数据、创作者信息、所有权说明和钱包浏览流程的数字收藏品市场"],
  "orbit-flora": ["a plant-intelligence assistant with photo identification, health diagnosis, care timeline, environmental readings, and personalized reminders", "包含照片识别、健康诊断、养护时间线、环境读数和个性提醒的植物智能助手"],
  "organic-odyssey": ["an organic lifestyle story with tactile natural imagery, ingredient or origin journey, product ritual, sustainability proof, and shop entry", "通过触感自然图片、成分或产地旅程、产品仪式、可持续证明和购物入口展开的有机生活故事"],
  "personal-showcase": ["a personal creative profile with a concise introduction, selected work strip, skill evidence, current availability, and direct contact", "包含精炼个人介绍、精选作品条带、能力证据、当前档期和直接联系的个人创意档案"],
  "pet-diagnostics": ["a veterinary diagnostic app with symptom intake, pet profile, test progress, explainable result summary, urgency guidance, and clinic follow-up", "包含症状录入、宠物档案、检测进度、可解释结果摘要、紧急程度指导和诊所跟进的宠物诊断应用"],
  "pixel-grid-hover": ["a case-study grid where every pixel-like tile reveals project identity, role, outcome, media preview, and keyboard-accessible navigation", "让每个像素化卡片揭示项目身份、角色、结果、媒体预览并支持键盘导航的案例网格"],
  "place-saver": ["a travel bookmarking app with map pins, collection folders, quick notes, collaborative sharing, and an itinerary-ready saved list", "包含地图标记、收藏文件夹、快捷笔记、协作分享和可用于行程的保存列表的旅行收藏应用"],
  "planetary-pulse": ["a planetary science dashboard with rotating globe, live environmental readings, anomaly timeline, mission markers, and comparative datasets", "包含旋转星球、实时环境读数、异常时间线、任务标记和对比数据集的行星科学仪表盘"],
  "portal-hero": ["a dimensional gateway hero where an animated portal frames the headline, destination choices, progress cue, and an invitation to enter", "让动态传送门承载标题、目的地选择、进度提示和进入邀请的维度入口首屏"],
  "portal": ["a futuristic access experience with a central doorway, layered environment, route selection, identity cue, and a deliberate enter transition", "包含中央门廊、分层环境、路线选择、身份提示和有意进入过渡的未来访问体验"],
  "portfolio-about": ["a personal about section combining portrait, short biography, experience timeline, selected disciplines, values, and availability", "把人物肖像、简短传记、经历时间线、精选专业、价值观和档期结合起来的个人介绍模块"],
  "portfolio-cosmic-hero": ["a cosmic creative portfolio with orbiting project artifacts, a role statement, project coordinates, exploration controls, and contact signal", "包含轨道式项目物件、角色陈述、项目坐标、探索控制和联系信号的宇宙创意作品集"],
  "power-ai-hero": ["an enterprise AI hero that pairs a forceful outcome statement with model capabilities, workflow preview, governance proof, and demo access", "把有力结果主张、模型能力、工作流预览、治理证明和演示入口配对的企业 AI 首屏"],
  "price-calculator": ["an interactive pricing calculator with usage sliders, plan assumptions, live total, included capacity, cost explanation, and quote handoff", "包含用量滑杆、方案假设、实时总价、包含容量、成本解释和报价衔接的交互定价计算器"],
  "prisma-landing": ["a color-forward creative studio landing page with an expressive manifesto, project spectrum, service lenses, process snapshots, and inquiry", "包含富有表现力的宣言、项目光谱、服务视角、流程片段和咨询入口的高彩创意工作室落地页"],
  "prompt-hero": ["an AI prompt product landing page with an editable prompt artifact, outcome preview, reusable patterns, workflow proof, and try-now action", "包含可编辑提示词作品、结果预览、可复用模式、工作流证明和立即体验操作的 AI 提示产品落地页"],
  "prosthetics-hero": ["an advanced prosthetics product hero with human motion imagery, device detail callouts, personalization steps, clinical reassurance, and consultation", "包含人体运动图像、设备细节标注、个性化步骤、临床保障和咨询入口的先进假肢产品首屏"],
  "radial-diagram": ["a testimonial system that arranges customer portraits around a central outcome, reveals quotes on selection, and exposes clear carousel controls", "把客户肖像围绕核心结果排列、选择后揭示引言并提供清晰轮播控制的用户评价系统"],
  "real-time-alerts": ["a secure alert-platform sign-in with live-status context, credential fields, recovery path, authentication reassurance, and incident-aware messaging", "包含实时状态语境、凭据字段、恢复路径、认证保障和事件感知信息的安全预警平台登录页"],
  "retro-futurist": ["a retro-future product hero blending analog interface cues, bold headline, device visualization, specification snippets, and launch action", "把模拟界面线索、醒目标题、设备可视化、规格片段和发布操作融合起来的复古未来产品首屏"],
  "rivr-hero": ["a fluid digital-service hero where a river-like path connects the promise, live flow indicators, service destinations, and a guided next step", "用河流般路径连接价值承诺、实时流量指标、服务目的地和引导下一步的流体数字服务首屏"],
  "rocket-cta": ["a launch-themed conversion block with one ambitious statement, mission countdown cue, supporting proof, readiness note, and a single ignition action", "包含雄心主张、任务倒计时提示、支持证据、准备说明和单一启动操作的发射主题转化模块"],
  "rocket-pricing": ["a mission-themed pricing comparison with payload-like plan tiers, feature limits, billing control, recommended route, and transparent overage notes", "包含载荷式方案层级、功能限制、计费控制、推荐路线和透明超额说明的任务主题价格比较"],
  "saas-value": ["a SaaS value section connecting three customer outcomes to product mechanisms, contextual metrics, concise evidence, and a demo bridge", "把三项客户结果与产品机制、语境化指标、精炼证据和演示衔接连接起来的 SaaS 价值模块"],
  "securify-hero": ["a data-security platform hero with protected-asset map, live risk posture, policy automation, compliance proof, and assessment request", "包含受保护资产地图、实时风险态势、策略自动化、合规证明和评估申请的数据安全平台首屏"],
  "sentinel-ai-hero": ["an AI monitoring hero with sentinel-like visual focus, detection stream, prioritized findings, explainable response, and guided deployment", "包含哨兵式视觉焦点、检测流、优先发现、可解释响应和引导部署的 AI 监控首屏"],
  "signal-id": ["a digital identity product explaining capture, verification, confidence scoring, privacy controls, and integration through one continuous signal path", "通过连续信号路径说明采集、核验、置信评分、隐私控制和集成的数字身份产品"],
  "skybridge-404": ["an aviation-themed not-found page with a broken route metaphor, flight-style status panel, destination shortcuts, and return-to-terminal action", "包含中断航线隐喻、航班式状态面板、目的地捷径和返回航站楼操作的航空主题 404 页面"],
  "skyelite-hero": ["a private-aviation landing page with cinematic aircraft, route request, cabin highlights, service assurance, and discreet booking contact", "包含电影感飞机、航线申请、客舱亮点、服务保障和私密预订联系的私人航空落地页"],
  "sparkform": ["a generative creative tool where a compact brief becomes evolving visual forms, adjustable parameters, saved variations, and export-ready output", "让精简需求生成演化视觉形态、可调参数、保存变体和可导出结果的生成式创意工具"],
  "stark-minimal-footer": ["an ultra-minimal footer with a precise brand sign-off, essential route list, one contact channel, legal links, and strong whitespace", "包含精确品牌落款、必要路径列表、单一联系渠道、法律链接和充足留白的超极简页脚"],
  "stellar-ai-hero": ["a space-scaled AI platform hero with constellation-like model connections, capability orbit, output preview, trust proof, and launch action", "包含星座式模型连接、能力轨道、输出预览、信任证明和启动操作的宇宙尺度 AI 平台首屏"],
  "stillmind": ["a meditation experience with a quiet breathing focal point, session choices, duration control, gentle progress, and distraction-free start", "包含安静呼吸焦点、练习选择、时长控制、温和进度和无干扰开始入口的冥想体验"],
  "subscription-agency": ["a subscription design agency page with monthly deliverables, request queue preview, plan boundaries, turnaround proof, and membership start", "包含月度交付物、需求队列预览、方案边界、周转时间证明和会员开始入口的订阅式设计机构页面"],
  "synth-mode": ["a synth-inspired fashion editorial with a statement look, collection sequence, fabric detail, colorway switching, and shop-the-look action", "包含主打造型、系列序列、面料细节、配色切换和购买整套造型操作的合成器风格时尚编辑页"],
  "talent-collective": ["a talent network landing page with curated specialist profiles, discipline filters, availability, collaboration model, and project-matching brief", "包含精选专业人才档案、领域筛选、档期、协作模式和项目匹配需求的才华网络落地页"],
  "task-engine": ["a task-automation SaaS page showing an intake queue, rule engine, execution stages, exception handling, outcome metrics, and template start", "展示任务接入队列、规则引擎、执行阶段、异常处理、结果指标和模板启动的任务自动化 SaaS 页面"],
  "taskly-hero": ["a task-management hero with today view, priority grouping, collaborative updates, completion rhythm, and a frictionless first-project action", "包含今日视图、优先级分组、协作更新、完成节奏和低摩擦首个项目操作的任务管理首屏"],
  "tech-forward": ["a technology consultancy hero that connects a future-facing thesis to transformation capabilities, system evidence, selected outcomes, and consultation", "把前瞻论点、转型能力、系统证据、精选成果和咨询入口连接起来的科技咨询首屏"],
  "tech-noir-about": ["a noir technology studio story with cryptic opening statement, origin timeline, operating code, specialist roles, and selective contact", "包含神秘开场陈述、起源时间线、行动准则、专业角色和选择性联系入口的黑色科技工作室故事"],
  "transform-data-hero": ["a data-transformation platform showing messy source inputs becoming governed models, visual pipelines, quality checks, and usable outputs", "展示杂乱源数据如何变成受治理模型、可视管道、质量检查和可用输出的数据转换平台"],
  "travel-journal": ["an editorial travel journal with a lead journey, map-linked stories, place notes, photography sequence, and save-for-later reading", "包含主打旅程、地图联动故事、地点笔记、摄影序列和稍后阅读收藏的编辑式旅行日志"],
  "trustflow": ["a financial workflow product with approval stages, transaction context, risk checks, audit trail, role-aware actions, and trustworthy completion", "包含审批阶段、交易语境、风险检查、审计轨迹、角色感知操作和可信完成状态的金融工作流产品"],
  "vaultshield": ["a digital-vault security hero with protected-item visualization, access health, threat blocking, recovery readiness, and security setup action", "包含受保护项目可视化、访问健康、威胁拦截、恢复准备和安全设置操作的数字保险库首屏"],
  "velorah-hero": ["an elegant boutique-agency hero with refined positioning, one art-directed case, service cues, process promise, and discreet inquiry", "包含精致定位、一个艺术指导案例、服务线索、流程承诺和克制咨询入口的精品机构首屏"],
  "vex-ventures-hero": ["a venture fund hero connecting an investment thesis to founder momentum, sector map, portfolio signals, and pitch submission", "把投资论点、创始人势能、行业地图、投资组合信号和项目提交入口连接起来的风投基金首屏"],
  "vision-reveal": ["a visual-discovery hero where an obscured scene progressively reveals product meaning, comparison controls, detail hotspots, and an explore action", "让被遮蔽场景逐步揭示产品含义、对比控制、细节热点和探索操作的视觉发现首屏"],
  "visual-hero": ["a generative visual studio hero with a living canvas, prompt or parameter controls, variation strip, fullscreen inspection, and create action", "包含动态画布、提示或参数控制、变体条带、全屏检查和创建操作的生成式视觉工作室首屏"],
  "vize-footer": ["a design-platform footer that closes with a concise product promise, organized resource columns, support route, newsletter, and status link", "以精炼产品承诺、清晰资源列、支持路径、邮件订阅和状态链接收束的设计平台页脚"],
  "vortex-studio-hero": ["an AI designer portfolio where a swirling generative centerpiece connects selected experiments, tool fluency, process notes, and project contact", "让旋涡式生成视觉连接精选实验、工具能力、过程说明和项目联系的 AI 设计师作品集"],
  "wanderful-hero": ["a joyful travel service hero with destination collage, trip-style selector, featured route, traveler reassurance, and planning action", "包含目的地拼贴、旅行方式选择、主打路线、旅客保障和规划操作的愉悦旅行服务首屏"],
  "wellbeing-os": ["a personal wellbeing operating system with daily status, habit modules, recovery signal, weekly pattern, and one prioritized recommendation", "包含每日状态、习惯模块、恢复信号、每周模式和单一优先建议的个人健康操作系统"],
  "wellness-balance": ["a balanced wellness hero pairing physical and mental pathways, daily rhythm preview, practitioner guidance, and a choose-your-focus action", "把身体与心理路径、每日节奏预览、专业指导和选择关注重点操作配对的平衡健康首屏"],
  "wellness-companion": ["a supportive wellness companion with mood check-in, guided practice, progress reflection, safety resources, and a gentle next step", "包含情绪签到、引导练习、进度反思、安全资源和温和下一步的支持型健康陪伴产品"],
  "wellness-device": ["a connected wellness-device launch with product close-up, live biometric reading, usage ritual, companion-app view, and preorder path", "包含产品特写、实时生理读数、使用仪式、配套应用视图和预订路径的联网健康设备发布页"],
  "wellness-hero": ["a restorative wellness hero with sensory imagery, concise benefit promise, program choices, trusted guidance, and a low-pressure consultation", "包含感官图片、精炼收益承诺、项目选择、可信指导和低压力咨询的修复型健康首屏"],
};

const compositionZh = {
  "a centered focal composition": "居中的视觉焦点构图",
  "a compact navigation sidebar": "紧凑侧边导航",
  "a dense but legible dashboard shell": "信息密集但清晰的仪表盘框架",
  "a comparison layout with clear plan hierarchy, feature scanning, and an accessible billing switch": "层级清楚、便于扫读并带无障碍计费切换的比较布局",
  "a disciplined card grid": "秩序严谨的卡片网格",
  "a feature presentation with clear hierarchy, concise benefits, and visual demonstrations": "层级清楚、利益点精炼且带视觉演示的功能展示",
  "a full-viewport opening composition": "占满首屏的开场构图",
  "a high-impact hero section with navigation, a concise value proposition, primary and secondary actions, and a visual focal point": "包含导航、精炼价值主张、主次操作和视觉焦点的高冲击首屏",
  "a horizontal showcase track": "横向展示轨道",
  "a modular bento grid": "模块化 Bento 网格",
  "a responsive masonry rhythm": "响应式瀑布流节奏",
  "a structured footer with brand summary, grouped navigation, utility links, and a concise closing action": "包含品牌摘要、分组导航、实用链接和收束操作的结构化页脚",
  "an asymmetric split layout": "非对称分栏布局",
  "an editorial company story with a concise mission, evidence, and human context": "包含精炼使命、证据和人物语境的编辑式公司故事",
};

const visualZh = {
  "bright neutral canvas": "明亮中性画布",
  "cinematic depth and lighting": "电影感纵深与光影",
  "contemporary retro references": "当代复古元素",
  "controlled luminous accents": "克制的发光强调",
  "dark high-contrast palette": "深色高对比配色",
  "editorial art direction": "编辑式视觉指导",
  "fine atmospheric grain": "细腻氛围颗粒",
  "layered frosted-glass surfaces": "有层次的磨砂玻璃表面",
  "monochrome contrast": "单色对比",
  "organic forms and natural rhythm": "有机形态与自然节奏",
  "playful but disciplined visual language": "活泼但有秩序的视觉语言",
  "precise futuristic styling": "精确的未来主义风格",
  "quiet premium detailing": "安静克制的高级细节",
  "restrained minimalist styling": "克制的极简风格",
  "subtle directional gradients": "细微方向性渐变",
};

const motionZh = {
  "a continuously looping marquee": "连续循环跑马灯",
  "a restrained pointer-following effect": "克制的指针跟随",
  "animated accordion expansion": "手风琴展开动画",
  "animated tab switching": "标签页切换动画",
  "keyboard-accessible carousel motion": "支持键盘操作的轮播动画",
  "lightweight 3D-inspired depth": "轻量 3D 景深",
  "masked content reveals": "遮罩式内容揭示",
  "purposeful hover feedback": "有明确意图的悬停反馈",
  "scroll-linked progression": "与滚动进度联动的动画",
  "slow ambient floating motion": "缓慢环境漂浮动画",
  "staggered entrance transitions": "错峰入场过渡",
  "sticky sectional storytelling": "粘性分段叙事",
  "subtle multi-layer parallax": "细微多层视差",
};

const contentGoalZh = {
  "a compact evidence section that gives each metric context instead of showing decorative numbers": "紧凑证据模块，每个指标都有明确语境而不是装饰性数字",
  "a comparison layout with clear plan hierarchy, feature scanning, and an accessible billing switch": "层级清楚、便于扫读并带无障碍计费切换的方案比较",
  "a complete landing page with a focused hero, trust evidence, benefits, product proof, conversion section, and footer": "包含聚焦首屏、信任证据、收益、产品证明、转化区和页脚的完整落地页",
  "a feature presentation with clear hierarchy, concise benefits, and visual demonstrations": "层级清楚、收益精炼并带视觉演示的功能展示",
  "a focused conversion block with one dominant message, supporting proof, and a single primary action": "包含一个主信息、支持证据和单一主操作的聚焦转化模块",
  "a high-impact hero section with navigation, a concise value proposition, primary and secondary actions, and a visual focal point": "包含导航、精炼价值主张、主次操作和视觉焦点的高冲击首屏",
  "a memorable not-found state with a clear recovery path": "有记忆点且提供清晰恢复路径的未找到状态",
  "a proof-focused testimonial composition with readable quotes and explicit controls": "以证据为核心、引言清楚且控件明确的用户评价模块",
  "a responsive application shell with clear navigation and task-focused content regions": "带清晰导航和任务导向内容区的响应式应用框架",
  "a responsive editorial feed with a lead story and scannable secondary articles": "包含头条和易扫读次级文章的响应式编辑内容流",
  "a reusable marketing section with one clear purpose and disciplined content hierarchy": "目标单一、内容层级严谨的可复用营销模块",
  "a structured footer with brand summary, grouped navigation, utility links, and a concise closing action": "包含品牌摘要、分组导航、实用链接和收束操作的结构化页脚",
  "an editorial company story with a concise mission, evidence, and human context": "包含精炼使命、证据和人物语境的编辑式公司故事",
};

const spacingZh = {
  "compact but breathable": "紧凑但有呼吸感",
  "editorially paced": "具有编辑节奏",
  "highly structured": "高度结构化",
  spacious: "宽松",
};

const typographyZh = {
  "a clean humanist sans-serif with tabular numerals": "带等宽数字的人文无衬线字体",
  "a geometric sans-serif with a restrained monospace accent": "几何无衬线字体，辅以克制的等宽字体",
  "a high-contrast display face paired with a neutral UI sans-serif": "高对比展示字体搭配中性 UI 无衬线字体",
  "a modern grotesk with an editorial serif accent": "现代 Grotesk 字体，辅以编辑感衬线字体",
};

const headingSets = [
  ["IMPLEMENTATION CONTRACT", "VISUAL READING", "EXPERIENCE BLUEPRINT", "MOTION CHOREOGRAPHY", "RESPONSIVE TRANSFORMATION", "ACCEPTANCE CHECKS"],
  ["BUILD BASIS", "ART DIRECTION", "INTERFACE ANATOMY", "INTERACTION RHYTHM", "BREAKPOINT BEHAVIOR", "DEFINITION OF DONE"],
  ["TECHNICAL FRAME", "DESIGN SYSTEM", "USER JOURNEY", "ANIMATION LOGIC", "DEVICE ADAPTATION", "QUALITY GATE"],
  ["PRODUCTION RULES", "VISUAL LANGUAGE", "CONTENT ARCHITECTURE", "BEHAVIOR AND FEEDBACK", "RESPONSIVE STRATEGY", "FINAL VERIFICATION"],
  ["ENGINEERING SCOPE", "COMPOSITION AND TYPE", "PAGE SEQUENCE", "MOTION DIRECTION", "MOBILE AND DESKTOP", "SHIP CRITERIA"],
  ["FRONTEND FOUNDATION", "LOOK AND FEEL", "CORE SURFACES", "INTERACTION MODEL", "LAYOUT TRANSITIONS", "REVIEW CHECKLIST"],
  ["RUNTIME BOUNDARY", "ART-DIRECTION NOTES", "INFORMATION FLOW", "MICROINTERACTIONS", "SCREEN-SIZE RULES", "RELEASE STANDARD"],
];

const headingSetsZh = [
  ["实施约束", "视觉解读", "体验结构", "动画编排", "响应式转化", "验收检查"],
  ["构建基础", "美术方向", "界面组成", "交互节奏", "断点行为", "完成标准"],
  ["技术框架", "设计系统", "用户旅程", "动画逻辑", "设备适配", "质量门禁"],
  ["生产规则", "视觉语言", "内容架构", "行为与反馈", "响应式策略", "最终核验"],
  ["工程范围", "构图与字体", "页面序列", "动态方向", "手机与桌面", "交付条件"],
  ["前端基础", "观感定义", "核心界面", "交互模型", "布局转换", "评审清单"],
  ["运行边界", "艺术指导说明", "信息流", "微交互", "屏幕尺寸规则", "发布标准"],
];

const stackEn = [
  "Implement with React 19, TypeScript, Vite, Tailwind CSS v4, motion/react, and lucide-react. Keep the component tree typed and frontend-only.",
  "Use React 19 + TypeScript on Vite, Tailwind CSS v4 for layout tokens, motion/react for purposeful animation, and lucide-react for interface icons.",
  "Build a runnable Vite frontend with React 19 and TypeScript; style it in Tailwind CSS v4, animate it with motion/react, and source functional icons from lucide-react.",
  "The delivery stack is React 19, TypeScript, Vite, Tailwind CSS v4, motion/react, and lucide-react; avoid adding a backend or unrelated packages.",
  "Create a clean React 19 + TypeScript + Vite implementation. Use Tailwind CSS v4, motion/react, and lucide-react as the only presentation essentials.",
  "Ship this as a React 19 + TypeScript application running on Vite, with Tailwind CSS v4 design tokens, motion/react transitions, and lucide-react controls.",
  "Start from React 19, TypeScript, and Vite. Compose responsive styles with Tailwind CSS v4, interaction motion with motion/react, and icons with lucide-react.",
];

const stackZh = [
  "使用 React 19、TypeScript、Vite、Tailwind CSS v4、motion/react 和 lucide-react 实现；组件树保持强类型且仅包含前端能力。",
  "采用 React 19 + TypeScript + Vite，使用 Tailwind CSS v4 管理布局令牌、motion/react 实现有意义的动画、lucide-react 提供界面图标。",
  "交付可运行的 React 19 与 TypeScript Vite 前端；使用 Tailwind CSS v4 编写样式、motion/react 编排动画、lucide-react 提供功能图标。",
  "固定技术栈为 React 19、TypeScript、Vite、Tailwind CSS v4、motion/react 和 lucide-react；不要增加后端或无关依赖。",
  "构建整洁的 React 19 + TypeScript + Vite 实现，展示层只使用 Tailwind CSS v4、motion/react 和 lucide-react。",
  "以 React 19 + TypeScript 应用交付，运行于 Vite，使用 Tailwind CSS v4 设计令牌、motion/react 过渡和 lucide-react 控件。",
  "从 React 19、TypeScript 和 Vite 开始，以 Tailwind CSS v4 组织响应式样式、motion/react 处理交互动画、lucide-react 提供图标。",
];

const motionSupportEn = [
  ["Animate transforms and opacity instead of layout-heavy properties; provide immediate hover, focus, pressed, selected, loading, success, and failure feedback where the flow needs it.", "Keyboard users must reach the same outcomes as pointer users; under prefers-reduced-motion, remove parallax, autoplay loops, and large travel while preserving state changes."],
  ["Treat motion as information: entrances establish hierarchy, direct manipulation responds immediately, and exits never delay the next task.", "Mirror every pointer path with keyboard controls and visible focus; prefers-reduced-motion must replace spatial travel with stable fades or instant state changes."],
  ["Keep animation on composited properties, stop ambient sequences when offscreen, and never make reading wait for a reveal to finish.", "Test the complete flow with keyboard input; when prefers-reduced-motion is active, disable looping, parallax, and depth effects without hiding content."],
  ["Use motion to connect cause and effect, not to decorate idle space; selected, loading, success, and error transitions must remain unambiguous.", "Provide equivalent keyboard behavior and persistent focus styling, and make prefers-reduced-motion a first-class static composition rather than an afterthought."],
  ["Sequence movement from the primary action outward, cancel stale transitions after rapid input, and avoid animating width, height, top, or left.", "All controls must complete through keyboard navigation; prefers-reduced-motion removes continuous movement while retaining concise opacity feedback."],
  ["Limit simultaneous animation layers, pause media outside the viewport, and reserve emphasis motion for the element that changed state.", "Maintain logical keyboard order and visible focus through every transition; prefers-reduced-motion should produce an equally legible non-animated path."],
  ["Choreograph entry, interaction, and exit as separate states, using transforms and opacity so the interface stays responsive under load.", "Confirm keyboard parity for hover-only discoveries and expose the same information in a stable prefers-reduced-motion presentation."],
];

const motionSupportZh = [
  ["优先动画 transform 与 opacity，不动画高成本布局属性；按流程需要提供即时悬停、焦点、按下、选中、加载、成功和失败反馈。", "键盘用户必须得到与指针用户相同的结果；prefers-reduced-motion 下移除视差、自动循环和大幅位移，同时保留状态变化。"],
  ["把动画当作信息：入场建立层级，直接操作立即响应，退场不得拖延下一任务。", "每条指针路径都要有键盘操作和可见焦点；prefers-reduced-motion 用稳定淡入或即时状态变化替代空间位移。"],
  ["只在合成属性上运行动画，元素离开视口后停止环境效果，不得让用户等待揭示动画结束才能阅读。", "使用键盘完成全部流程；prefers-reduced-motion 启用时关闭循环、视差和景深，但不能隐藏内容。"],
  ["动画只解释因果，不装饰空闲区域；选中、加载、成功和错误过渡都必须明确。", "提供等效键盘行为和持续可见的焦点样式，并把 prefers-reduced-motion 设计成正式静态构图。"],
  ["运动从主操作向外展开，快速连续输入时取消过时过渡，避免动画 width、height、top 或 left。", "所有控件都能用键盘完成；prefers-reduced-motion 移除持续运动，只保留精炼透明度反馈。"],
  ["限制同时运行动画的层数，暂停视口外媒体，只让发生状态变化的元素获得强调。", "所有过渡保持合理键盘顺序和可见焦点；prefers-reduced-motion 提供同样清晰的无动画路径。"],
  ["把入场、交互和退场拆成独立状态，使用 transform 与 opacity 保证负载下仍流畅。", "为仅悬停可见的信息提供键盘等价路径，并在 prefers-reduced-motion 中稳定展示相同内容。"],
];

const acceptanceEn = [
  ["Use semantic HTML, visible focus, accurate labels, and descriptive alternatives; text and controls must meet WCAG AA and no state may rely on color alone.", "Verify the core flow: every button and link works, media failure has a fallback, long content never clips, and the console stays error-free.", "Reuse typed components and design tokens instead of duplicating layout code; deliver a runnable project, a short README, and recorded breakpoint checks."],
  ["Meet WCAG AA with semantic landmarks, correctly associated labels, visible focus, and alternatives for meaningful media.", "Exercise primary, empty, loading, success, and failure paths; remove broken links, clipped text, page-level overflow, and console errors.", "Keep component boundaries typed, document install and run steps, and state which 360px, 768px, and 1440px checks were completed."],
  ["Maintain WCAG AA contrast, logical heading order, accessible names for icon controls, and status messages that do not depend on color.", "Confirm that the main task survives missing media, slow loading, long copy, repeated input, and an entirely keyboard-driven session.", "Return a complete Vite project with shared tokens, reusable components, no unnecessary dependency, and concise operating notes."],
  ["Apply WCAG AA to text and controls, preserve source order, label every input, and provide meaningful alternative text only where imagery carries information.", "Test all calls to action, external routes, expandable regions, and failure fallbacks; the finished interface must produce no clipping or runtime errors.", "Keep data and presentation typed, consolidate repeated styles, and include a README with setup plus responsive and reduced-motion verification."],
  ["Use semantic elements and WCAG AA contrast, expose visible focus at every stop, and announce asynchronous state changes to assistive technology.", "Validate the intended conversion or task path from first action to completion, including disabled, error, retry, and media-unavailable states.", "Ship clean component boundaries, documented design tokens, a runnable build, and a compact record of device-width checks."],
  ["Reach WCAG AA while keeping labels, descriptions, heading hierarchy, and focus order understandable without the visual layout.", "Review every interactive state with mouse, touch, and keyboard; prevent dead controls, broken assets, clipped content, horizontal overflow, and console noise.", "Use small typed components, centralize repeated constants, and provide install, run, build, and validation notes in the README."],
  ["Ensure WCAG AA contrast, semantic structure, accessible control names, visible focus, and text equivalents for any information-bearing visual.", "Complete a release pass for navigation, forms, media fallback, long content, error recovery, and runtime console health.", "Deliver reusable typed code, shared tokens, no speculative services, and a short README that records desktop, tablet, mobile, and reduced-motion checks."],
];

const acceptanceZh = [
  ["使用语义化 HTML、可见焦点、准确标签和描述性替代文本；文字与控件达到 WCAG AA，状态不能只依赖颜色。", "验收核心流程：所有按钮和链接可用，媒体失败有回退，长内容不裁切，控制台无错误。", "复用强类型组件与设计令牌，避免重复布局代码；交付可运行项目、简短 README 和断点检查记录。"],
  ["通过语义地标、正确关联的标签、可见焦点和有意义媒体的替代信息达到 WCAG AA。", "覆盖主流程、空、加载、成功和失败路径，消除失效链接、文字裁切、页面横向溢出和控制台错误。", "保持组件边界强类型，记录安装与运行步骤，并注明完成的 360px、768px 和 1440px 检查。"],
  ["保持 WCAG AA 对比度、合理标题顺序、纯图标控件的可访问名称，以及不依赖颜色的状态信息。", "确认主任务在媒体缺失、加载缓慢、长文案、重复输入和全键盘会话下仍可完成。", "返回完整 Vite 项目，使用共享令牌和可复用组件，不增加无关依赖，并提供精炼运行说明。"],
  ["文字与控件达到 WCAG AA，保留合理源码顺序，给每个输入项添加标签，仅为承载信息的图片提供替代文本。", "检查所有操作、外部路径、展开区域和失败回退；完成界面不得出现裁切或运行时错误。", "保持数据和展示强类型，合并重复样式，并在 README 中记录配置、响应式和减少动态效果验收。"],
  ["使用语义元素和 WCAG AA 对比度，让每个焦点位置清楚可见，并向辅助技术播报异步状态变化。", "从首次操作到完成验收目标转化或任务路径，覆盖禁用、错误、重试和媒体不可用状态。", "交付清晰组件边界、已记录的设计令牌、可运行构建和精简设备宽度检查记录。"],
  ["达到 WCAG AA，并确保脱离视觉布局后标签、说明、标题层级和焦点顺序仍能理解。", "使用鼠标、触摸和键盘检查全部交互状态，避免失效控件、损坏资源、内容裁切、横向溢出和控制台噪声。", "使用小型强类型组件、集中重复常量，并在 README 中提供安装、运行、构建和验收说明。"],
  ["确保 WCAG AA 对比度、语义结构、控件可访问名称、可见焦点，以及信息型视觉的文字等价内容。", "完成导航、表单、媒体回退、长内容、错误恢复和控制台健康的发布检查。", "交付可复用强类型代码、共享令牌、不引入推测性服务，并在 README 记录桌面、平板、手机和减少动态效果检查。"],
];

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
  return meta;
}

function promptBlock(raw, heading = "原创英文提示词") {
  return raw.match(new RegExp("## " + heading + "\\s+```text\\s*([\\s\\S]*?)\\s*```"))?.[1]?.trim() ?? "";
}

function lineValue(prompt, label) {
  return prompt.match(new RegExp(`^- ${label}: (.+)$`, "m"))?.[1]?.trim() ?? "";
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function translateParts(value, dictionary, separator = ";") {
  return value
    .replace(/\.$/, "")
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => dictionary[part] ?? part)
    .join("、");
}

function signatureFrom(meta, oldPrompt) {
  const clean = (value) => String(value || "").trim().replace(/\.$/, "");
  const spacing = oldPrompt.match(/^- Use a (.+?) spacing rhythm, a maximum content width of (\d+px), and a base surface radius around (\d+px)\.$/m);
  return {
    composition: clean(meta.design_composition || lineValue(oldPrompt, "Primary composition")),
    visual: clean(meta.design_visual || lineValue(oldPrompt, "Visual language")),
    palette: clean(meta.design_palette || lineValue(oldPrompt, "Suggested palette").replace(/\. Treat these[\s\S]*$/, "")),
    typography: clean(meta.design_typography || lineValue(oldPrompt, "Typography").replace(/\. Maintain a clear display\/body\/UI hierarchy\.$/, "")),
    spacing: meta.design_spacing || spacing?.[1] || "editorially paced",
    maxWidth: meta.design_max_width || spacing?.[2] || "1280px",
    radius: meta.design_radius || spacing?.[3] || "16px",
    motion: clean(meta.design_motion || oldPrompt.match(/^- Use (.+) as the primary motion vocabulary\.$/m)?.[1] || "purposeful hover feedback"),
    duration: meta.design_duration || oldPrompt.match(/Keep ordinary transitions within (\d+–\d+ms)/)?.[1] || "220–320ms",
    contentGoal: clean(meta.design_content_goal || oldPrompt.match(/CONTENT AND STRUCTURE\n- (.+)$/m)?.[1] || "a focused, complete frontend experience"),
  };
}

function classify(meta, signature) {
  const category = meta.category.toLowerCase();
  const id = meta.id.toLowerCase();
  if (category === "404" || id.includes("404")) return "error";
  if (meta.primary_group === "Apps") return "app";
  if (meta.primary_group === "Sections") return "section";
  if (/footer/.test(category + id)) return "section";
  if (/pricing|calculator/.test(category + id)) return "pricing";
  if (/portfolio|agency|creative/.test(category) && !signature.contentGoal.startsWith("a high-impact hero")) return "story";
  if (/travel/.test(category)) return "journey";
  if (/wellness|health|medicine|healthcare/.test(category)) return "care";
  if (/dashboard|application shell/.test(signature.contentGoal)) return "app";
  if (/complete landing page/.test(signature.contentGoal)) return "page";
  return "hero";
}

function experienceLines(kind, concept, language) {
  const en = {
    error: [
      `Make the failure state itself useful: stage ${concept}, then present the recovery choices in the first keyboard tab sequence.`,
      "Keep the status message, search or destination shortcuts, and primary return action visually separate so the user never reaches a dead end.",
      "Do not invent a full marketing site around the error; make one memorable screen and a compact navigation fallback.",
    ],
    app: [
      `Make the main workspace specifically serve ${concept}; avoid a generic dashboard filled with unrelated cards.`,
      "Define the primary task, one supporting insight surface, and the exact empty, loading, selected, success, and error states needed for that workflow.",
      "Use a small typed local dataset only where records must be visible, label simulated information clearly, and persist nothing beyond optional device-local preferences.",
    ],
    section: [
      `Build one reusable section around ${concept}, with typed content props and no dependency on the surrounding page theme.`,
      "Provide a complete default example, a clear section heading hierarchy, and enough outer spacing for the component to sit between unrelated sections.",
      "Keep the section focused on one job; do not expand it into a generic page, navigation shell, or invented product suite.",
    ],
    pricing: [
      `Center the decision flow on ${concept}; changes to quantity, billing mode, or plan must update the total and explanation immediately.`,
      "Separate included value, constraints, recommended choice, and exceptional costs so comparison works without relying on color alone.",
      "Use transparent fictional amounts and deterministic local calculations; never imply a real checkout or connect a payment service.",
    ],
    story: [
      `Shape the narrative around ${concept}, moving from a distinctive point of view to concrete work, role clarity, evidence, and contact.`,
      "Let imagery and project detail carry the proof; avoid fake client-logo walls, unsupported awards, or decorative capability grids.",
      "Give every case or chapter a clear entry and exit so the page reads coherently with motion disabled.",
    ],
    journey: [
      `Turn ${concept} into a browsable journey with meaningful place, route, or schedule context instead of generic destination cards.`,
      "Connect discovery to a saved choice or planning action, and make location, timing, price assumptions, and availability explicitly fictional.",
      "Use maps and imagery as progressive enhancement; the itinerary and primary route must remain understandable without them.",
    ],
    care: [
      `Organize ${concept} around reassurance, informed choice, and one calm next step rather than aggressive conversion.`,
      "Distinguish educational content, practitioner or device evidence, program options, and support resources with plain-language headings.",
      "Use fictional wellness claims, avoid diagnosis or guaranteed outcomes, and expose safety or escalation guidance where the interface suggests care decisions.",
    ],
    page: [
      `Build a complete narrative for ${concept}: focused opening, product or service proof, mechanism, benefits, evidence, conversion, and compact footer.`,
      "Give every section a different communication job and let the visual focal element evolve instead of repeating the same card grid.",
      "Use concise fictional copy and contextual evidence; omit invented enterprise logos, live counters, and claims that cannot be demonstrated in the interface.",
    ],
    hero: [
      `Concentrate the opening viewport on ${concept}, with one dominant promise, supporting explanation, primary action, secondary route, and visual proof.`,
      "Expose just enough adjacent content to signal what follows; do not turn the hero into a generic feature dashboard or duplicate the same message in multiple cards.",
      "The value proposition and primary action must remain complete when decorative media and advanced motion are unavailable.",
    ],
  };

  const zh = {
    error: [
      `让失败状态本身有用：以${concept}建立记忆点，并把恢复选项放进最先到达的键盘焦点顺序。`,
      "明确区分状态说明、搜索或目的地捷径和主返回操作，避免用户进入真正的死路。",
      "不要围绕错误页虚构完整营销网站；只构建一个有记忆点的屏幕和精简导航回退。",
    ],
    app: [
      `让主工作区专门服务于${concept}，不要用无关卡片拼成通用仪表盘。`,
      "定义核心任务、一个辅助洞察区域，以及该流程真正需要的空、加载、选中、成功和错误状态。",
      "只有界面必须展示记录时才使用少量强类型本地数据，清楚标记模拟信息，除可选设备偏好外不做持久化。",
    ],
    section: [
      `围绕${concept}构建单一可复用模块，内容通过强类型属性传入，不依赖外部页面主题。`,
      "提供完整默认示例、清楚标题层级和足够外边距，使组件能嵌入互不相关的页面区块之间。",
      "模块只完成一个任务，不要扩展成通用整页、导航框架或虚构产品套件。",
    ],
    pricing: [
      `让决策流程围绕${concept}展开；数量、计费模式或方案改变时，总价和解释必须立即同步。`,
      "明确分开包含价值、使用限制、推荐选择和额外成本，且比较不能只依赖颜色。",
      "使用透明的虚构金额和确定性本地计算；不要暗示真实结账，也不要连接支付服务。",
    ],
    story: [
      `围绕${concept}组织叙事，从鲜明观点推进到具体作品、角色说明、证据和联系入口。`,
      "让图像和项目细节承担证明，避免虚假客户徽标、无依据奖项或装饰性能力网格。",
      "每个案例或章节都要有清楚入口与出口，关闭动画后页面仍能连贯阅读。",
    ],
    journey: [
      `把${concept}做成可浏览旅程，提供真实有用的地点、路线或日程语境，而不是通用目的地卡片。`,
      "把发现行为连接到收藏或规划操作，并明确地点、时间、价格假设和可用状态均为虚构。",
      "地图和图片只做渐进增强；缺少媒体时，行程与主路线仍必须清楚。",
    ],
    care: [
      `围绕放心、知情选择和一个平静下一步组织${concept}，避免强迫式转化。`,
      "用直白标题区分科普内容、从业者或设备证据、项目选项和支持资源。",
      "所有健康主张必须为虚构，不做诊断或保证结果；涉及照护决策时提供安全或升级指导。",
    ],
    page: [
      `为${concept}构建完整叙事：聚焦开场、产品或服务证明、作用机制、收益、证据、转化和精简页脚。`,
      "让每个区块承担不同沟通任务，并让视觉焦点持续演化，不要重复同一种卡片网格。",
      "使用精炼虚构文案和有语境的证据；省略虚构企业徽标、实时计数和界面无法证明的主张。",
    ],
    hero: [
      `把首屏集中在${concept}，包含一个主承诺、支持解释、主操作、次级路径和视觉证明。`,
      "只露出足够的后续内容提示页面走向，不要把首屏做成通用功能仪表盘，也不要在多张卡片里重复同一信息。",
      "装饰媒体和高级动画不可用时，价值主张与主操作仍必须完整成立。",
    ],
  };
  return language === "zh" ? zh[kind] : en[kind];
}

function responsiveLines(signature, language) {
  const composition = signature.composition.toLowerCase();
  if (language === "zh") {
    if (composition.includes("asymmetric split")) return ["桌面端保持非对称分栏；平板缩窄媒体列，360px 手机端按“主信息—主操作—媒体—辅助内容”重排。", "1440px、768px 和 360px 都不得出现横向溢出；触控目标至少 44px，并保持媒体正确宽高比。"];
    if (composition.includes("grid") || composition.includes("masonry")) return ["在 1440px 展示完整网格节奏，768px 减少列数，360px 重组为单列并保留明确浏览顺序。", "不要仅靠视觉位置表达关系；DOM 顺序、键盘顺序和屏幕阅读器顺序必须一致，触控目标至少 44px。"];
    if (composition.includes("dashboard") || composition.includes("sidebar")) return ["1440px 桌面端允许侧栏与多面板，768px 合并次级信息，360px 压缩成单一主任务和可展开辅助面板。", "表格、图表和控制项不得被裁切；必要时提供语义化滚动容器、紧凑标签和至少 44px 的触控目标。"];
    return ["在 1440px 保留完整视觉层级，768px 收紧装饰与间距，360px 采用单列阅读顺序并优先保留主操作。", "媒体使用响应式尺寸与正确宽高比，首屏以下延迟加载；触控目标至少 44px，页面不得横向溢出。"];
  }
  if (composition.includes("asymmetric split")) return ["Preserve the asymmetric split on desktop; narrow the media column at tablet width, then reorder mobile as message, primary action, media, supporting content.", "At 1440px, 768px, and 360px there must be no horizontal overflow; touch targets stay at least 44px and media keeps its intended aspect ratio."];
  if (composition.includes("grid") || composition.includes("masonry")) return ["Show the full grid rhythm at 1440px, reduce columns at 768px, and reorganize the interface into one deliberate reading column at 360px.", "Do not communicate relationships through placement alone; DOM, keyboard, and screen-reader order must agree, with 44px minimum touch targets."];
  if (composition.includes("dashboard") || composition.includes("sidebar")) return ["Allow sidebar and multi-panel context at 1440px, merge secondary information at 768px, and reduce mobile to one primary task plus expandable support panels at 360px.", "Tables, charts, and controls must not clip; use semantic scroll regions, compact labels, and touch targets of at least 44px where needed."];
  return ["Retain the complete hierarchy at 1440px, tighten decoration and spacing at 768px, and use a single reading column with the primary action preserved at 360px.", "Size media responsively with correct aspect ratios and lazy-load it below the fold; keep 44px touch targets and eliminate page-level horizontal overflow."];
}

function buildPrompt(meta, signature, language) {
  const seed = hashSeed(meta.id);
  const profile = profiles[meta.id];
  if (!profile) throw new Error(`${meta.id} 缺少独立产品画像`);
  const concept = language === "zh" ? profile[1] : profile[0];
  const headings = (language === "zh" ? headingSetsZh : headingSets)[seed % headingSets.length];
  const stack = (language === "zh" ? stackZh : stackEn)[(seed >>> 4) % stackEn.length];
  const motionSupport = (language === "zh" ? motionSupportZh : motionSupportEn)[(seed >>> 8) % motionSupportEn.length];
  const acceptance = (language === "zh" ? acceptanceZh : acceptanceEn)[(seed >>> 12) % acceptanceEn.length];
  const kind = classify(meta, signature);
  const experience = experienceLines(kind, concept, language);
  const responsive = responsiveLines(signature, language);
  const composition = language === "zh" ? translateParts(signature.composition, compositionZh) : signature.composition;
  const visual = language === "zh" ? translateParts(signature.visual, visualZh) : signature.visual;
  const motion = language === "zh" ? translateParts(signature.motion, motionZh, ",") : signature.motion;
  const contentGoal = language === "zh" ? (contentGoalZh[signature.contentGoal] ?? signature.contentGoal) : signature.contentGoal;
  const spacing = language === "zh" ? (spacingZh[signature.spacing] ?? signature.spacing) : signature.spacing;
  const typography = language === "zh" ? (typographyZh[signature.typography] ?? signature.typography) : signature.typography;
  const spacingArticle = /^[aeiou]/i.test(signature.spacing) ? "an" : "a";
  const opener = language === "zh"
    ? `请设计并实现${concept}。以公开预览呈现的设计类型和交互能力为依据，但使用全新的中性品牌、原创文案和可替换素材，不得复刻任何现有页面。`
    : `Design and implement ${concept}. Use the public preview only to understand the design type and interaction capability; invent a neutral brand, original copy, and replaceable assets instead of cloning an existing page.`;
  const scope = language === "zh"
    ? `参考范围：${contentGoal}。除非界面确实需要，否则不要添加登录、数据库、分析、支付或外部服务。`
    : `Reference scope: ${contentGoal}. Do not add authentication, databases, analytics, payments, or external services unless the visible experience genuinely needs them.`;
  const visualLines = language === "zh"
    ? [
        `主体构图采用${composition}；视觉语言由${visual}构成。`,
        `把 ${signature.palette} 转成命名清楚的 CSS 设计令牌；使用 ${typography} 建立展示文字、正文、数据和控件层级。`,
        `内容最大宽度约 ${signature.maxWidth}，采用${spacing}的间距节奏，基础圆角约 ${signature.radius}；需要无障碍对比时允许调整色值。`,
        "所有装饰都必须强化信息层级或操作，不添加通用渐变光斑、随机玻璃卡和无意义图标阵列。",
      ]
    : [
        `Compose the page with ${composition}; express that structure through ${visual}.`,
        `Turn ${signature.palette} into named CSS design tokens; use ${typography} to separate display, body, data, and control typography.`,
        `Target a ${signature.maxWidth} content width, ${spacingArticle} ${spacing} spacing rhythm, and roughly ${signature.radius} base radii; adjust colors when accessible contrast requires it.`,
        "Every decorative element must reinforce hierarchy or operation; omit generic gradient blobs, random glass cards, and meaningless icon grids.",
      ];
  const motionLines = language === "zh"
    ? [
        `使用${motion}突出焦点内容和状态变化；常规反馈控制在 ${signature.duration}，更长动画只用于明确的场景转换。`,
        ...motionSupport,
      ]
    : [
        `Use ${motion} to stage the focal artifact and clarify state changes; keep ordinary feedback within ${signature.duration} and reserve longer animation for explicit scene changes.`,
        ...motionSupport,
      ];

  return [
    opener,
    "",
    headings[0],
    stack,
    scope,
    "",
    headings[1],
    ...visualLines.map((line) => `- ${line}`),
    "",
    headings[2],
    ...experience.map((line, index) => `${index + 1}. ${line}`),
    "",
    headings[3],
    ...motionLines.map((line) => `- ${line}`),
    "",
    headings[4],
    ...responsive.map((line) => `- ${line}`),
    "",
    headings[5],
    ...acceptance.map((line) => `- ${line}`),
  ].join("\n");
}

function setDesignMetadata(raw, signature) {
  const fields = {
    generation_mode: "original-equivalent-v2",
    design_composition: signature.composition,
    design_visual: signature.visual,
    design_palette: signature.palette,
    design_typography: signature.typography,
    design_spacing: signature.spacing,
    design_max_width: signature.maxWidth,
    design_radius: signature.radius,
    design_motion: signature.motion,
    design_duration: signature.duration,
    design_content_goal: signature.contentGoal,
  };
  let next = raw;
  for (const [key, value] of Object.entries(fields)) {
    const line = `${key}: ${JSON.stringify(value)}`;
    const pattern = new RegExp(`^${key}:.*$`, "m");
    if (pattern.test(next)) next = next.replace(pattern, line);
    else next = next.replace(/^---\r?\n/, `---\n${line}\n`);
  }
  return next;
}

function replacePromptBlocks(raw, promptEn, promptZh) {
  const enBlock = `## 原创英文提示词\n\n\`\`\`text\n${promptEn}\n\`\`\``;
  const zhBlock = `## 原创中文提示词\n\n\`\`\`text\n${promptZh}\n\`\`\``;
  let next = raw.replace(/## 原创英文提示词\s+```text\s*[\s\S]*?\s*```/, enBlock);
  if (/## 原创中文提示词\s+```text/.test(next)) {
    next = next.replace(/## 原创中文提示词\s+```text\s*[\s\S]*?\s*```/, zhBlock);
  } else {
    next = next.replace(/\n## 使用建议/, `\n\n${zhBlock}\n\n## 使用建议`);
  }
  return next;
}

const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith(".md")).sort();
if (files.length !== 147) throw new Error(`预期 147 个 Markdown，实际 ${files.length} 个`);
if (Object.keys(profiles).length !== 147) throw new Error(`预期 147 个独立画像，实际 ${Object.keys(profiles).length} 个`);

for (const file of files) {
  const filePath = path.join(sourceDir, file);
  const raw = await fs.readFile(filePath, "utf8");
  const meta = parseFrontmatter(raw);
  const oldPrompt = promptBlock(raw);
  const signature = signatureFrom(meta, oldPrompt);
  const promptEn = buildPrompt(meta, signature, "en");
  const promptZh = buildPrompt(meta, signature, "zh");
  const withMeta = setDesignMetadata(raw, signature);
  const updated = replacePromptBlocks(withMeta, promptEn, promptZh);
  await fs.writeFile(filePath, updated, "utf8");
}

console.log(`已重写 ${files.length} 份中英文提示词：${sourceDir}`);
