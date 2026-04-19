import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_BASE = "https://contentflow-production-81fd.up.railway.app/api";

const CONTENT_TYPES = [
  { id: "blog",    label: "Blog Post",     icon: "✦" },
  { id: "social",  label: "Social Media",  icon: "◈" },
  { id: "email",   label: "Email",         icon: "◉" },
  { id: "product", label: "Product Copy",  icon: "◆" },
];

const REFINE_ACTIONS = [
  { id: "improve", label: "✨ Improve" },
  { id: "shorten", label: "✂ Shorten"  },
  { id: "expand",  label: "⊕ Expand"   },
  { id: "formal",  label: "🎩 Formal"   },
  { id: "casual",  label: "💬 Casual"   },
];

// Typewriter hook — same as before
function useTypewriter(text, speed = 6) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(iv); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return { displayed, done };
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState("generate");

  // ── Generate state ──────────────────────────────────
  const [contentType, setContentType] = useState("blog");
  const [topic, setTopic]             = useState("");
  const [output, setOutput]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);
  const [refining, setRefining]       = useState(false);

  // ── Bulk state ──────────────────────────────────────
  const [bulkMode, setBulkMode]       = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Summarize state ─────────────────────────────────
  const [summaryText, setSummaryText]     = useState("");
  const [summaryOutput, setSummaryOutput] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError]   = useState("");

  // ── History state ───────────────────────────────────
  const [history, setHistory]             = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [expandedHistory, setExpandedHistory] = useState(null);

  // ── AutoPost state ──────────────────────────────────
  const [schedTopic, setSchedTopic]   = useState("");
  const [schedType, setSchedType]     = useState("blog");
  const [scheduleIn, setScheduleIn]   = useState("5");
  const [queue, setQueue]             = useState([]);
  const [scheduling, setScheduling]   = useState(false);
  const [schedError, setSchedError]   = useState("");
  const [expandedPost, setExpandedPost] = useState(null);

  const { displayed, done } = useTypewriter(output);
  const { displayed: sumDisplayed, done: sumDone } = useTypewriter(summaryOutput);

  // ── Data fetching ───────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/content/history`);
      setHistory(await res.json());
    } catch { /* silent */ }
    setHistoryLoading(false);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/autopost/queue`);
      setQueue(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (activeTab === "history")  fetchHistory();
    if (activeTab === "autopost") fetchQueue();
  }, [activeTab, fetchHistory, fetchQueue]);

  // Poll queue every 30s while on AutoPost tab
  useEffect(() => {
    if (activeTab !== "autopost") return;
    const id = setInterval(fetchQueue, 30000);
    return () => clearInterval(id);
  }, [activeTab, fetchQueue]);

  // ── Handlers ────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setOutput(""); setError(""); setBulkResults(null);
    try {
      const res  = await fetch(`${API_BASE}/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contentType, topic }),  // ← FIX: was "contentType"
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutput(data.content);  // ← FIX: was res.text() → raw JSON
    } catch (e) { setError(e.message || "Connection failed."); }
    setLoading(false);
  };

  const handleBulk = async () => {
    if (!topic.trim()) return;
    setBulkLoading(true); setBulkResults(null); setOutput(""); setError("");
    try {
      const res  = await fetch(`${API_BASE}/content/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      setBulkResults(await res.json());
    } catch { setError("Bulk generation failed."); }
    setBulkLoading(false);
  };

  const handleRefine = async (action) => {
    if (!output || refining) return;
    const prev = output;
    setRefining(true); setOutput("");
    try {
      const res  = await fetch(`${API_BASE}/content/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prev, action }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutput(data.content);
    } catch (e) { setError(e.message || "Refinement failed."); setOutput(prev); }
    setRefining(false);
  };

  const handleSummarize = async () => {
    if (!summaryText.trim()) return;
    setSummaryLoading(true); setSummaryOutput(""); setSummaryError("");
    try {
      const res  = await fetch(`${API_BASE}/content/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaryOutput(data.summary);
    } catch (e) { setSummaryError(e.message || "Summarization failed."); }
    setSummaryLoading(false);
  };

  const handleSchedule = async () => {
    if (!schedTopic.trim()) return;
    setScheduling(true); setSchedError("");
    try {
      const res  = await fetch(`${API_BASE}/autopost/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: schedTopic, type: schedType, scheduleIn }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSchedTopic(""); fetchQueue();
    } catch (e) { setSchedError(e.message || "Scheduling failed."); }
    setScheduling(false);
  };

  const handleDeleteQueue = async (id) => {
    try { await fetch(`${API_BASE}/autopost/${id}`, { method: "DELETE" }); fetchQueue(); }
    catch { /* silent */ }
  };

  const handleDeleteHistory = async (id) => {
    try { await fetch(`${API_BASE}/content/history/${id}`, { method: "DELETE" }); fetchHistory(); }
    catch { /* silent */ }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text ?? output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchTab = (tab) => {
    setActiveTab(tab); setError(""); setSummaryError("");
  };

  const filteredHistory = historyFilter === "all"
    ? history
    : history.filter(h => h.type === historyFilter);

  // ── Render ───────────────────────────────────────────
  return (
    <div className="cf-app">
      <div className="cf-orb cf-orb-1" />
      <div className="cf-orb cf-orb-2" />

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="cf-sidebar">
        <div className="cf-logo">
          <div className="cf-logo-mark">CF</div>
          <span className="cf-logo-text">ContentFlow</span>
        </div>
        <div className="cf-nav-section-label">Tools</div>
        <nav className="cf-nav">
          {[
            { id: "generate",  icon: "+", label: "Generate"  },
            { id: "summarize", icon: "~", label: "Summarize" },
            { id: "history",   icon: "⊡", label: "History"   },
            { id: "autopost",  icon: "⟳", label: "AutoPost"  },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              className={`cf-nav-item ${activeTab === id ? "active" : ""}`}
              onClick={() => switchTab(id)}
            >
              <span className="cf-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="cf-sidebar-footer">
          <div className="cf-model-badge">
            <span className="cf-dot" />
            <span>Llama 3.3 70B</span>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="cf-main">
        <div className="cf-content">

          {/* ════ GENERATE TAB ════ */}
          {activeTab === "generate" && (
            <>
              <div className="cf-header">
                <h1>Generate content</h1>
                <p>Pick a format, enter your topic, get publish-ready copy.</p>
              </div>

              <div className="cf-panel">
                <div className="cf-field">
                  <label className="cf-label">Content type</label>
                  <div className="cf-type-grid">
                    {CONTENT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        className={`cf-type-btn ${contentType === t.id ? "active" : ""}`}
                        onClick={() => setContentType(t.id)}
                      >
                        <span className="cf-type-icon">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cf-field">
                  <label className="cf-label">Topic</label>
                  <input
                    className="cf-input"
                    placeholder="e.g. The future of AI in software development"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !bulkMode && handleGenerate()}
                  />
                </div>

                <div className="cf-btn-row">
                  <button
                    className="cf-btn"
                    onClick={bulkMode ? handleBulk : handleGenerate}
                    disabled={(loading || bulkLoading) || !topic.trim()}
                  >
                    {(loading || bulkLoading)
                      ? <span className="cf-spinner" />
                      : bulkMode ? "Generate All →" : "Generate →"}
                  </button>
                  <button
                    className={`cf-toggle-btn ${bulkMode ? "active" : ""}`}
                    onClick={() => { setBulkMode(!bulkMode); setBulkResults(null); setOutput(""); }}
                  >
                    ⊞ {bulkMode ? "Bulk ON" : "Bulk OFF"}
                  </button>
                </div>
              </div>

              {/* Single output panel */}
              {!bulkMode && (output || loading || error) && (
                <div className="cf-panel cf-output-panel">
                  <div className="cf-output-header">
                    <span className="cf-label">{done && output ? "Output ✓" : "Output"}</span>
                    {output && (
                      <div className="cf-output-actions">
                        <button className="cf-action-btn" onClick={() => setOutput("")}>Clear</button>
                        <button className={`cf-action-btn ${copied ? "copied" : ""}`} onClick={() => handleCopy()}>
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                  {loading && (
                    <div className="cf-loading">
                      <div className="cf-bars"><span /><span /><span /></div>
                      <p>Generating with Llama 3.3 70B...</p>
                    </div>
                  )}
                  {error && <div className="cf-error">{error}</div>}
                  {output && !loading && (
                    <>
                      <pre className="cf-output-text">
                        {displayed}{!done && <span className="cf-cursor">▋</span>}
                      </pre>
                      {done && (
                        <div className="cf-refine-bar">
                          <span className="cf-label">Refine output</span>
                          <div className="cf-refine-actions">
                            {REFINE_ACTIONS.map((a) => (
                              <button
                                key={a.id}
                                className="cf-refine-btn"
                                onClick={() => handleRefine(a.id)}
                                disabled={refining}
                              >
                                {refining ? "·· ·" : a.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Bulk output panel */}
              {bulkMode && (bulkResults || bulkLoading) && (
                <div className="cf-panel">
                  <span className="cf-label">
                    {bulkLoading ? "Generating all 4 formats..." : "All Formats ✓"}
                  </span>
                  {bulkLoading && (
                    <div className="cf-loading">
                      <div className="cf-bars"><span /><span /><span /></div>
                      <p>Running 4 prompts sequentially...</p>
                    </div>
                  )}
                  {bulkResults && (
                    <div className="cf-bulk-grid">
                      {CONTENT_TYPES.map((t) =>
                        bulkResults[t.id] ? (
                          <div key={t.id} className="cf-bulk-card">
                            <div className="cf-bulk-card-header">
                              <span>{t.icon} {t.label}</span>
                              <button className="cf-action-btn" onClick={() => handleCopy(bulkResults[t.id])}>
                                Copy
                              </button>
                            </div>
                            <pre className="cf-output-text cf-bulk-text">{bulkResults[t.id]}</pre>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════ SUMMARIZE TAB ════ */}
          {activeTab === "summarize" && (
            <>
              <div className="cf-header">
                <h1>Summarize text</h1>
                <p>Paste any text and get a clean, sharp summary.</p>
              </div>
              <div className="cf-panel">
                <div className="cf-field">
                  <label className="cf-label">Text to summarize</label>
                  <textarea
                    className="cf-textarea"
                    placeholder="Paste your article, document, or any long-form text here..."
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={6}
                  />
                  <span className="cf-char-count">{summaryText.length} chars</span>
                </div>
                <button className="cf-btn" onClick={handleSummarize} disabled={summaryLoading || !summaryText.trim()}>
                  {summaryLoading ? <span className="cf-spinner" /> : "Summarize →"}
                </button>
              </div>
              {(summaryOutput || summaryLoading || summaryError) && (
                <div className="cf-panel cf-output-panel">
                  <div className="cf-output-header">
                    <span className="cf-label">{sumDone && summaryOutput ? "Summary ✓" : "Summary"}</span>
                    {summaryOutput && (
                      <div className="cf-output-actions">
                        <button className="cf-action-btn" onClick={() => setSummaryOutput("")}>Clear</button>
                        <button className={`cf-action-btn ${copied ? "copied" : ""}`} onClick={() => handleCopy(summaryOutput)}>
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                  {summaryLoading && (
                    <div className="cf-loading">
                      <div className="cf-bars"><span /><span /><span /></div>
                      <p>Summarizing with Llama 3.3 70B...</p>
                    </div>
                  )}
                  {summaryError && <div className="cf-error">{summaryError}</div>}
                  {summaryOutput && !summaryLoading && (
                    <pre className="cf-output-text">
                      {sumDisplayed}{!sumDone && <span className="cf-cursor">▋</span>}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════ HISTORY TAB ════ */}
          {activeTab === "history" && (
            <>
              <div className="cf-header">
                <h1>Content history</h1>
                <p>Browse and reuse every generation — saved automatically.</p>
              </div>
              <div className="cf-panel">
                <div className="cf-history-filters">
                  {["all", "blog", "social", "email", "product", "summary", "refined"].map((f) => (
                    <button
                      key={f}
                      className={`cf-filter-btn ${historyFilter === f ? "active" : ""}`}
                      onClick={() => setHistoryFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <button className="cf-action-btn" style={{ marginLeft: "auto" }} onClick={fetchHistory}>
                    ↺ Refresh
                  </button>
                </div>

                {historyLoading && (
                  <div className="cf-loading">
                    <div className="cf-bars"><span /><span /><span /></div>
                    <p>Loading history...</p>
                  </div>
                )}

                {!historyLoading && filteredHistory.length === 0 && (
                  <div className="cf-empty">No items yet. Generate some content first!</div>
                )}

                <div className="cf-history-list">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="cf-history-item">
                      <div
                        className="cf-history-item-header"
                        onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                      >
                        <div className="cf-history-meta">
                          <span className="cf-type-tag">{item.type}</span>
                          <span className="cf-history-topic">{item.topic}</span>
                        </div>
                        <div className="cf-history-actions">
                          <span className="cf-history-date">{formatDate(item.createdAt)}</span>
                          <button className="cf-action-btn" onClick={(e) => { e.stopPropagation(); handleCopy(item.content); }}>
                            Copy
                          </button>
                          <button className="cf-action-btn danger" onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}>
                            ✕
                          </button>
                        </div>
                      </div>
                      {expandedHistory === item.id && (
                        <pre className="cf-output-text cf-history-content">{item.content}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ════ AUTOPOST TAB ════ */}
          {activeTab === "autopost" && (
            <>
              <div className="cf-header">
                <h1>AutoPost scheduler</h1>
                <p>Schedule content to generate automatically. The server checks every 60 seconds.</p>
              </div>

              {/* Schedule form */}
              <div className="cf-panel">
                <span className="cf-label">New scheduled post</span>

                <div className="cf-field">
                  <label className="cf-label">Topic</label>
                  <input
                    className="cf-input"
                    placeholder="e.g. Why open-source AI will dominate by 2027"
                    value={schedTopic}
                    onChange={(e) => setSchedTopic(e.target.value)}
                  />
                </div>

                <div className="cf-field">
                  <label className="cf-label">Content type</label>
                  <div className="cf-type-grid">
                    {CONTENT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        className={`cf-type-btn ${schedType === t.id ? "active" : ""}`}
                        onClick={() => setSchedType(t.id)}
                      >
                        <span className="cf-type-icon">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cf-field">
                  <label className="cf-label">Generate in (minutes from now)</label>
                  <input
                    className="cf-input"
                    type="number" min="1" max="1440"
                    value={scheduleIn}
                    onChange={(e) => setScheduleIn(e.target.value)}
                    style={{ maxWidth: "160px" }}
                  />
                </div>

                {schedError && <div className="cf-error">{schedError}</div>}

                <button className="cf-btn" onClick={handleSchedule} disabled={scheduling || !schedTopic.trim()}>
                  {scheduling ? <span className="cf-spinner" /> : "Schedule →"}
                </button>
              </div>

              {/* Queue */}
              <div className="cf-panel">
                <div className="cf-output-header">
                  <span className="cf-label">Queue ({queue.length})</span>
                  <button className="cf-action-btn" onClick={fetchQueue}>↺ Refresh</button>
                </div>

                {queue.length === 0 && (
                  <div className="cf-empty">Queue is empty. Schedule a post above!</div>
                )}

                <div className="cf-queue-list">
                  {queue.map((post) => (
                    <div key={post.id} className="cf-queue-item">
                      <div className="cf-queue-main">
                        <span className={`cf-status-badge status-${post.status.toLowerCase()}`}>
                          {post.status === "PENDING" ? "⏳" : post.status === "GENERATED" ? "✓" : "✕"} {post.status}
                        </span>
                        <div className="cf-queue-info">
                          <span className="cf-history-topic">{post.topic}</span>
                          <span className="cf-type-tag">{post.type}</span>
                        </div>
                        <div className="cf-queue-time">
                          <span className="cf-history-date">📅 {formatDate(post.scheduledFor)}</span>
                          {post.generatedAt && (
                            <span className="cf-history-date" style={{ color: "var(--success)" }}>
                              ✓ {formatDate(post.generatedAt)}
                            </span>
                          )}
                        </div>
                        <div className="cf-queue-actions">
                          {post.generatedContent && (
                            <button
                              className="cf-action-btn"
                              onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                            >
                              {expandedPost === post.id ? "Hide" : "View"}
                            </button>
                          )}
                          {post.generatedContent && (
                            <button className="cf-action-btn" onClick={() => handleCopy(post.generatedContent)}>
                              Copy
                            </button>
                          )}
                          <button className="cf-action-btn danger" onClick={() => handleDeleteQueue(post.id)}>✕</button>
                        </div>
                      </div>
                      {expandedPost === post.id && post.generatedContent && (
                        <pre className="cf-output-text cf-history-content">{post.generatedContent}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}