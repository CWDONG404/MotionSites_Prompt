"use client";

import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  ImageOff,
  Languages,
  PenLine,
  Search,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PromptRecord } from "./prompt-data";

type PromptLayer = "official" | "translation" | "rewrite";
type RewriteLanguage = "en" | "zh";
type LocalOfficialPrompt = {
  officialPrompt: string;
  officialPromptZh: string;
  savedAt: string;
};

const localOfficialStorageKey = "prompt-atlas:official-prompts:v1";

const layerMeta: Record<PromptLayer, { eyebrow: string; title: string; end: string }> = {
  official: { eyebrow: "OFFICIAL FULL PROMPT", title: "官网原文", end: "OFFICIAL SOURCE" },
  translation: { eyebrow: "CHINESE TRANSLATION", title: "官方原文中文翻译", end: "中文翻译" },
  rewrite: { eyebrow: "ORIGINAL EQUIVALENT", title: "原创改写", end: "ORIGINAL REWRITE" },
};

const sourceTabs = [
  "All",
  "Apps",
  "Sections",
  "Hero",
  "Landing Page",
  "SaaS",
  "Agency",
  "Portfolio",
  "3D Website",
  "Travel",
  "Ecommerce",
  "Wellness",
  "AI",
  "Carousel",
  "Technology",
  "Fintech",
  "Creative",
  "Fashion",
] as const;

const tabLabels: Record<string, string> = {
  All: "站点 All",
  Apps: "应用",
  Sections: "页面组件",
  Hero: "Hero",
  "Landing Page": "落地页",
  SaaS: "SaaS",
  Agency: "Agency",
  Portfolio: "作品集",
  "3D Website": "3D 网站",
  Travel: "旅行",
  Ecommerce: "电商",
  Wellness: "健康",
  AI: "AI",
  Carousel: "轮播",
  Technology: "科技",
  Fintech: "金融科技",
  Creative: "创意",
  Fashion: "时尚",
};

function Preview({ prompt, priority = false, detail = false }: { prompt: PromptRecord; priority?: boolean; detail?: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "available" | "missing" | "failed">(
    prompt.previewUrl ? "loading" : "missing",
  );
  const [videoActivated, setVideoActivated] = useState(priority || detail);
  const [videoVisible, setVideoVisible] = useState(priority || detail);

  useEffect(() => {
    if (prompt.previewType !== "video" || !frameRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVideoVisible(entry.isIntersecting);
        if (entry.isIntersecting) setVideoActivated(true);
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [prompt.previewType]);

  useEffect(() => {
    if (prompt.previewType !== "video" || !videoRef.current || !videoActivated) return;
    const video = videoRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (videoVisible && !reduceMotion) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [prompt.previewType, videoActivated, videoVisible]);

  const showMedia = status === "loading" || status === "available";
  return (
    <div ref={frameRef} className={`preview-frame${detail ? " preview-detail" : ""}`} data-preview-status={status}>
      {showMedia ? (
        prompt.previewType === "video" ? (
          <video
            ref={videoRef}
            src={videoActivated ? prompt.previewUrl : undefined}
            aria-label={`${prompt.title} 动态公开预览`}
            controls={detail}
            loop
            muted
            playsInline
            preload={priority ? "metadata" : "none"}
            onLoadedData={() => setStatus("available")}
            onError={() => setStatus("failed")}
          />
        ) : (
          // 预览来源域名不固定，使用原生 img 才能保留失败回退逻辑。
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prompt.previewUrl}
            alt={`${prompt.title} 公开预览`}
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setStatus("available")}
            onError={() => setStatus("failed")}
          />
        )
      ) : (
        <div
          className="preview-fallback"
          role="img"
          aria-label={status === "failed" ? `${prompt.title} 预览图加载失败` : `${prompt.title} 来源未提供预览图`}
        >
          <ImageOff size={26} aria-hidden="true" />
          <strong>{status === "failed" ? "预览图加载失败" : "来源未提供预览图"}</strong>
          <small>{prompt.category} · 仍可查看提示词</small>
        </div>
      )}
      <span className="free-chip">FREE</span>
    </div>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.tabIndex = -1;
    textarea.setAttribute("aria-hidden", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

export function PromptLibrary({ prompts }: { prompts: PromptRecord[] }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [sort, setSort] = useState<"title" | "category">("title");
  const [visibleCount, setVisibleCount] = useState(24);
  const [selected, setSelected] = useState<PromptRecord | null>(null);
  const [promptLayer, setPromptLayer] = useState<PromptLayer>("official");
  const [rewriteLanguage, setRewriteLanguage] = useState<RewriteLanguage>("en");
  const [localOfficialPrompts, setLocalOfficialPrompts] = useState<Record<string, LocalOfficialPrompt>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importOfficial, setImportOfficial] = useState("");
  const [importTranslation, setImportTranslation] = useState("");
  const [copyStatus, setCopyStatus] = useState<{ key: string; state: "success" | "error" } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const promptScrollRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let saved: Record<string, LocalOfficialPrompt> | null = null;
    try {
      const raw = window.localStorage.getItem(localOfficialStorageKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      // 无效的本地缓存不会阻塞资料库；用户仍可重新导入。
    }
    if (!saved) return;
    const timer = window.setTimeout(() => setLocalOfficialPrompts(saved ?? {}), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const tabCounts = useMemo(
    () => Object.fromEntries(sourceTabs.map((tab) => [tab, prompts.filter((prompt) => prompt.tabs.includes(tab)).length])),
    [prompts],
  );

  const officialCount = useMemo(
    () => prompts.filter((prompt) => prompt.officialPrompt || localOfficialPrompts[prompt.id]?.officialPrompt).length,
    [localOfficialPrompts, prompts],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return prompts
      .filter((prompt) => {
        const matchesTab = !activeTab || prompt.tabs.includes(activeTab);
        const localOfficial = localOfficialPrompts[prompt.id];
        const haystack = [
          prompt.title,
          prompt.category,
          prompt.primaryGroup,
          prompt.summary,
          prompt.scenario,
          prompt.tabs.join(" "),
          prompt.officialPrompt,
          prompt.officialPromptZh,
          localOfficial?.officialPrompt,
          localOfficial?.officialPromptZh,
          prompt.prompt,
          prompt.promptZh,
        ]
          .join(" ")
          .toLowerCase();
        return matchesTab && (!needle || haystack.includes(needle));
      })
      .sort((a, b) => {
        const left = sort === "category" ? `${a.category} ${a.title}` : a.title;
        const right = sort === "category" ? `${b.category} ${b.title}` : b.title;
        return left.localeCompare(right, "zh-CN", { sensitivity: "base" });
      });
  }, [activeTab, localOfficialPrompts, prompts, query, sort]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (event.key === "/" && !editing && !selected) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    promptScrollRef.current?.scrollTo({ top: 0 });
  }, [promptLayer, rewriteLanguage, selected?.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  useEffect(() => () => {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
  }, []);

  const handleCopy = async (key: string, text: string) => {
    const copied = await copyText(text);
    setCopyStatus({ key, state: copied ? "success" : "error" });
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyStatus(null), 1800);
  };

  const openPrompt = (prompt: PromptRecord) => {
    setPromptLayer("official");
    setImportOpen(false);
    setImportOfficial("");
    setImportTranslation("");
    setCopyStatus(null);
    setSelected(prompt);
  };

  const openImport = (prompt: PromptRecord) => {
    const local = localOfficialPrompts[prompt.id];
    setImportOfficial(local?.officialPrompt ?? prompt.officialPrompt ?? "");
    setImportTranslation(local?.officialPromptZh ?? prompt.officialPromptZh ?? "");
    setImportOpen(true);
  };

  const saveImport = (prompt: PromptRecord) => {
    const officialPrompt = importOfficial.trim();
    if (!officialPrompt) return;
    const next = {
      ...localOfficialPrompts,
      [prompt.id]: {
        officialPrompt,
        officialPromptZh: importTranslation.trim(),
        savedAt: new Date().toISOString(),
      },
    };
    setLocalOfficialPrompts(next);
    window.localStorage.setItem(localOfficialStorageKey, JSON.stringify(next));
    setImportOpen(false);
    setCopyStatus(null);
  };

  const removeImport = (prompt: PromptRecord) => {
    const next = { ...localOfficialPrompts };
    delete next[prompt.id];
    setLocalOfficialPrompts(next);
    window.localStorage.setItem(localOfficialStorageKey, JSON.stringify(next));
    setImportOpen(false);
    setCopyStatus(null);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveTab(null);
    setSort("title");
    setVisibleCount(24);
  };

  const visible = results.slice(0, visibleCount);
  const selectedLocalOfficial = selected ? localOfficialPrompts[selected.id] : undefined;
  const selectedOfficialPrompt = selectedLocalOfficial?.officialPrompt ?? selected?.officialPrompt ?? "";
  const selectedOfficialTranslation = selectedLocalOfficial?.officialPromptZh ?? selected?.officialPromptZh ?? "";
  const activePromptText = !selected
    ? ""
    : promptLayer === "official"
      ? selectedOfficialPrompt
      : promptLayer === "translation"
        ? selectedOfficialTranslation
        : rewriteLanguage === "zh" ? selected.promptZh : selected.prompt;
  const activePromptLanguage = promptLayer === "translation" || (promptLayer === "rewrite" && rewriteLanguage === "zh")
    ? "zh"
    : "en";
  const activePromptKey = selected
    ? `${selected.id}:${promptLayer}${promptLayer === "rewrite" ? `:${rewriteLanguage}` : ""}`
    : "";

  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Prompt Atlas 首页">
          <span className="brand-mark">PA</span>
          <span>Prompt Atlas</span>
        </a>
        <div className="masthead-actions">
          <a href="#library-title">浏览资料库</a>
          <span className="local-badge">LOCAL LIBRARY · 2026</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">FREE FRONTEND PROMPTS / CURATED LOCALLY</p>
          <h1>把灵感变成<br />可以直接开工的前端。</h1>
          <p className="hero-lede">
            147 个免费项目，按“官网原文、中文翻译、原创改写”分层呈现。没有导入的官网内容会明确留空，绝不再用改写内容代替。
          </p>
          <a className="hero-action" href="#library-title">
            开始浏览 <ChevronRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="hero-stats" aria-label="资料库统计">
          <div><strong>{prompts.length}</strong><span>免费项目</span></div>
          <div><strong>{officialCount}</strong><span>官网原文已录入</span></div>
          <div><strong>18</strong><span>来源 Tab</span></div>
        </div>
      </section>

      <section className="library" aria-labelledby="library-title">
        <div className="library-heading">
          <div>
            <p className="eyebrow">LIBRARY INDEX</p>
            <h2 id="library-title">浏览提示词</h2>
          </div>
          <label className="search-box">
            <span><Search size={13} aria-hidden="true" /> 搜索全部内容</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(24);
              }}
              placeholder="标题、类别、技术或设计特征…"
              aria-label="搜索提示词"
            />
            <kbd>/</kbd>
          </label>
        </div>

        <div className="filter-toolbar">
          <div className="source-tabs" aria-label="来源 Tab 筛选">
            <button
              className={!activeTab ? "active" : ""}
              onClick={() => {
                setActiveTab(null);
                setVisibleCount(24);
              }}
              type="button"
            >
              全部提示词 <span>{prompts.length}</span>
            </button>
            {sourceTabs.map((tab) => (
              <button
                className={activeTab === tab ? "active" : ""}
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setVisibleCount(24);
                }}
                type="button"
              >
                {tabLabels[tab]} <span>{tabCounts[tab]}</span>
              </button>
            ))}
          </div>
          <label className="sort-control">
            <span>排序</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as "title" | "category");
                setVisibleCount(24);
              }}
            >
              <option value="title">按标题</option>
              <option value="category">按类别</option>
            </select>
          </label>
        </div>

        <div className="result-line" aria-live="polite">
          <span>当前显示</span>
          <strong>{Math.min(visibleCount, results.length)}</strong>
          <span>/ {results.length} 个项目</span>
          {(query || activeTab) && (
            <button type="button" onClick={clearFilters}>清除筛选 <X size={13} aria-hidden="true" /></button>
          )}
        </div>

        {visible.length > 0 ? (
          <>
            <div className="prompt-grid">
              {visible.map((prompt, index) => (
                <article className="prompt-card" key={prompt.id}>
                  <Preview prompt={prompt} priority={index < 6} />
                  <div className="card-copy">
                    <div className="card-meta">
                      <span>{prompt.primaryGroup}</span>
                      <span>{prompt.category}</span>
                    </div>
                    <h3>{prompt.title}</h3>
                    <p>{prompt.scenario}</p>
                    <button type="button" className="open-button" onClick={() => openPrompt(prompt)}>
                      查看提示词 <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {visibleCount < results.length && (
              <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 24)}>
                再显示 {Math.min(24, results.length - visibleCount)} 个
                <span>{visibleCount} / {results.length}</span>
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Sparkles size={24} aria-hidden="true" />
            <h3>没有匹配的提示词</h3>
            <p>换一个关键词，或清除当前 Tab 筛选。</p>
            <button type="button" onClick={clearFilters}>查看全部 {prompts.length} 个</button>
          </div>
        )}
      </section>

      <footer className="footer">
        <div>
          <span className="brand-mark">PA</span>
          <strong>Prompt Atlas</strong>
        </div>
        <p>本地优先 · 三层来源 · 未导入不冒充</p>
        <a href="#top">回到顶部 ↑</a>
      </footer>

      <dialog
        className="prompt-dialog"
        ref={dialogRef}
        aria-labelledby="prompt-dialog-title"
        onClose={() => setSelected(null)}
        onCancel={() => setSelected(null)}
      >
        {selected && (
          <div className="dialog-layout">
            <aside className="dialog-aside">
              <Preview key={selected.id} prompt={selected} priority detail />
              <div className="dialog-meta">
                <span>{selected.primaryGroup}</span>
                <span>{selected.category}</span>
                <span>{selected.verifiedAt}</span>
              </div>
              <div className={`official-status${selectedOfficialPrompt ? " available" : " missing"}`}>
                <FileText size={16} aria-hidden="true" />
                <div>
                  <strong>{selectedOfficialPrompt ? "官网原文已录入" : "官网原文尚未导入"}</strong>
                  <span>
                    {selectedLocalOfficial
                      ? "仅保存在当前浏览器"
                      : selected.officialPrompt
                        ? `用户提供并核对 · ${selected.officialVerifiedAt ?? selected.verifiedAt}`
                        : "不会用原创改写内容代替"}
                  </span>
                </div>
              </div>
              {selectedLocalOfficial && (
                <button className="manage-import-button" type="button" onClick={() => openImport(selected)}>
                  <PenLine size={14} aria-hidden="true" /> 管理本地导入
                </button>
              )}
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
              <div className="dialog-tabs">
                {selected.tabs.map((tab) => <span key={tab}>{tabLabels[tab] ?? tab}</span>)}
              </div>
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                查看来源页面 <ExternalLink size={15} aria-hidden="true" />
              </a>
            </aside>

            <section className="dialog-content">
              <div className="dialog-toolbar">
                <div className="dialog-heading-row">
                  <div className="dialog-title">
                    <span>{layerMeta[promptLayer].eyebrow}</span>
                    <strong id="prompt-dialog-title">{layerMeta[promptLayer].title}</strong>
                  </div>
                  <button className="close-button" type="button" onClick={() => setSelected(null)} aria-label="关闭详情">
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
                <div className="dialog-action-row">
                  <div className="layer-switch" role="group" aria-label="提示词内容层级">
                    {(["official", "translation", "rewrite"] as const).map((layer) => (
                      <button
                        type="button"
                        key={layer}
                        className={promptLayer === layer ? "active" : ""}
                        aria-pressed={promptLayer === layer}
                        onClick={() => {
                          setPromptLayer(layer);
                          setImportOpen(false);
                          setCopyStatus(null);
                        }}
                      >
                        {layer === "official" ? "官网原文" : layer === "translation" ? "中文翻译" : "原创改写"}
                      </button>
                    ))}
                  </div>
                  {promptLayer === "rewrite" && (
                    <div className="language-switch" role="group" aria-label="原创改写语言">
                    <button
                      type="button"
                      className={rewriteLanguage === "en" ? "active" : ""}
                      aria-pressed={rewriteLanguage === "en"}
                      onClick={() => {
                        setRewriteLanguage("en");
                        setCopyStatus(null);
                      }}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      className={rewriteLanguage === "zh" ? "active" : ""}
                      aria-pressed={rewriteLanguage === "zh"}
                      onClick={() => {
                        setRewriteLanguage("zh");
                        setCopyStatus(null);
                      }}
                    >
                      中文
                    </button>
                  </div>
                  )}
                  <button
                    className="copy-button"
                    type="button"
                    disabled={!activePromptText}
                    onClick={() => handleCopy(activePromptKey, activePromptText)}
                  >
                    {copyStatus?.key === activePromptKey && copyStatus.state === "success"
                      ? <Check size={17} aria-hidden="true" />
                      : <Copy size={17} aria-hidden="true" />}
                    {copyStatus?.key === activePromptKey
                      ? copyStatus.state === "success" ? "已复制" : "复制失败"
                      : activePromptText ? "复制当前内容" : "暂无可复制内容"}
                  </button>
                </div>
              </div>
              {importOpen ? (
                <div
                  ref={promptScrollRef}
                  className="prompt-scroll prompt-empty"
                  role="region"
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                  tabIndex={0}
                  aria-label={`${selected.title} 本地导入管理`}
                >
                  <div className="official-empty official-editor">
                    <PenLine size={28} aria-hidden="true" />
                    <span>LOCAL IMPORT</span>
                    <h3>管理本地导入</h3>
                    <p>粘贴你通过官网免费 Copy 流程获得的内容。保存后，官网原文与中文翻译仍会作为两个独立层显示。</p>
                    <form
                      className="official-import"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveImport(selected);
                      }}
                    >
                      <label>
                        <span>官网 Full Prompt</span>
                        <textarea
                          required
                          value={importOfficial}
                          onChange={(event) => setImportOfficial(event.target.value)}
                          placeholder="粘贴从官网免费 Copy full prompt 获得的完整原文…"
                        />
                      </label>
                      <label>
                        <span>完整中文翻译（可稍后补充）</span>
                        <textarea
                          value={importTranslation}
                          onChange={(event) => setImportTranslation(event.target.value)}
                          placeholder="粘贴与官网原文对应的中文翻译…"
                        />
                      </label>
                      <small>内容仅写入当前浏览器的 localStorage，不上传、不写入 GitHub。</small>
                      <div className="official-import-actions">
                        <button type="submit" disabled={!importOfficial.trim()}>
                          <Save size={15} aria-hidden="true" /> 保存到当前浏览器
                        </button>
                        {selectedLocalOfficial && (
                          <button className="danger" type="button" onClick={() => removeImport(selected)}>
                            <Trash2 size={15} aria-hidden="true" /> 删除本地内容
                          </button>
                        )}
                        <button className="quiet" type="button" onClick={() => setImportOpen(false)}>取消</button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : activePromptText ? (
                <div
                  ref={promptScrollRef}
                  className={`prompt-scroll prompt-${activePromptLanguage}`}
                  role="region"
                  // 可聚焦的滚动区让键盘用户能够用方向键、PageDown 与 End 阅读全文。
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                  tabIndex={0}
                  aria-label={`${selected.title} ${layerMeta[promptLayer].title}全文，可上下滚动`}
                >
                  <pre lang={activePromptLanguage === "zh" ? "zh-CN" : "en"}>
                    <code>{activePromptText}</code>
                  </pre>
                  <p className="prompt-end">已显示完整内容 · {layerMeta[promptLayer].end}</p>
                </div>
              ) : (
                <div
                  ref={promptScrollRef}
                  className="prompt-scroll prompt-empty"
                  role="region"
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                  tabIndex={0}
                  aria-label={`${selected.title} ${layerMeta[promptLayer].title}导入状态`}
                >
                  <div className="official-empty">
                    {promptLayer === "translation" ? <Languages size={28} aria-hidden="true" /> : <FileText size={28} aria-hidden="true" />}
                    <span>{promptLayer === "translation" ? "TRANSLATION NOT IMPORTED" : "OFFICIAL SOURCE NOT IMPORTED"}</span>
                    <h3>{promptLayer === "translation" ? "中文翻译尚未录入" : "官网原文尚未导入"}</h3>
                    <p>
                      {promptLayer === "translation"
                        ? "先导入通过官网 Copy full prompt 获得的原文，再录入对应的完整中文翻译。"
                        : "打开来源页面，使用公开的 Copy full prompt，然后粘贴到本地导入区。未导入时不会显示原创改写来冒充官网内容。"}
                    </p>
                    <div className="official-empty-actions">
                      <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                        打开来源页面 <ExternalLink size={15} aria-hidden="true" />
                      </a>
                      <button type="button" onClick={() => openImport(selected)}>
                        <PenLine size={15} aria-hidden="true" /> 本地导入
                      </button>
                    </div>

                  </div>
                </div>
              )}
              <span className="copy-status" role="status" aria-live="polite">
                {copyStatus?.key === activePromptKey
                  ? copyStatus.state === "success" ? "当前层内容已复制到剪贴板" : "复制失败，请选择文本后手动复制"
                  : ""}
              </span>
            </section>
          </div>
        )}
      </dialog>
    </main>
  );
}
