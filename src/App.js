import { useState, useEffect } from "react";
import "./App.css";

const API_BASE = "https://contentflow-production-81fd.up.railway.app/api/content";

const CONTENT_TYPES = [
  { id: "blog", label: "Blog Post", icon: "✦" },
  { id: "social", label: "Social Media", icon: "◈" },
  { id: "email", label: "Email", icon: "◉" },
  { id: "product", label: "Product Copy", icon: "◆" },
];

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
  }, [text]);
  return { displayed, done };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("generate");
  const [contentType, setContentType] = useState("blog");
  const [topic, setTopic] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const { displayed, done } = useTypewriter(output);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setOutput(""); setError("");
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, topic }),
      });
      setOutput(await res.text());
    } catch { setError("Connection failed. Check your network or backend status."); }
    setLoading(false);
  };

  const handleSummarize = async () => {
    if (!summaryText.trim()) return;
    setLoading(true); setOutput(""); setError("");
    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryText }),
      });
      setOutput(await res.text());
    } catch { setError("Connection failed. Check your network or backend status."); }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchTab = (tab) => {
    setActiveTab(tab); setOutput(""); setError("");
  };

  return (
    <div className="cf-app">
      <div className="cf-orb cf-orb-1" />
      <div className="cf-orb cf-orb-2" />

      <aside className="cf-sidebar">
        <div className="cf-logo">
          <div className="cf-logo-mark">CF</div>
          <span className="cf-logo-text">ContentFlow</span>
        </div>
        <div className="cf-nav-section-label">Tools</div>
        <nav className="cf-nav">
          <button className={`cf-nav-item ${activeTab === "generate" ? "active" : ""}`} onClick={() => switchTab("generate")}>
            <span className="cf-nav-icon">+</span> Generate
          </button>
          <button className={`cf-nav-item ${activeTab === "summarize" ? "active" : ""}`} onClick={() => switchTab("summarize")}>
            <span className="cf-nav-icon">~</span> Summarize
          </button>
        </nav>
        <div className="cf-sidebar-footer">
          <div className="cf-model-badge">
            <span className="cf-dot" />
            Llama 3.3 70B
          </div>
        </div>
      </aside>

      <main className="cf-main">
        <div className="cf-content">
          <div className="cf-header">
            <h1>{activeTab === "generate" ? "Generate content" : "Summarize text"}</h1>
            <p>{activeTab === "generate"
              ? "Pick a format, enter your topic, get publish-ready copy."
              : "Paste any text and get a clean, sharp summary."
            }</p>
          </div>

          <div className="cf-panel">
            {activeTab === "generate" ? (
              <>
                <div className="cf-field">
                  <label className="cf-label">Content type</label>
                  <div className="cf-type-grid">
                    {CONTENT_TYPES.map((t) => (
                      <button key={t.id} className={`cf-type-btn ${contentType === t.id ? "active" : ""}`} onClick={() => setContentType(t.id)}>
                        <span className="cf-type-icon">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cf-field">
                  <label className="cf-label">Topic</label>
                  <input className="cf-input" placeholder="e.g. The future of AI in software development" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
                </div>
                <button className="cf-btn" onClick={handleGenerate} disabled={loading || !topic.trim()}>
                  {loading ? <span className="cf-spinner" /> : "Generate →"}
                </button>
              </>
            ) : (
              <>
                <div className="cf-field">
                  <label className="cf-label">Text to summarize</label>
                  <textarea className="cf-textarea" placeholder="Paste your article, document, or any long-form text here..." value={summaryText} onChange={(e) => setSummaryText(e.target.value)} rows={5} />
                  <span className="cf-char-count">{summaryText.length} chars</span>
                </div>
                <button className="cf-btn" onClick={handleSummarize} disabled={loading || !summaryText.trim()}>
                  {loading ? <span className="cf-spinner" /> : "Summarize →"}
                </button>
              </>
            )}
          </div>

          {(output || loading || error) && (
            <div className="cf-panel cf-output-panel">
              <div className="cf-output-header">
                <span className="cf-label">{done && output ? "Output ✓" : "Output"}</span>
                {output && (
                  <div className="cf-output-actions">
                    <button className="cf-action-btn" onClick={() => setOutput("")}>Clear</button>
                    <button className={`cf-action-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
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
                <pre className="cf-output-text">
                  {displayed}
                  {!done && <span className="cf-cursor">▋</span>}
                </pre>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}