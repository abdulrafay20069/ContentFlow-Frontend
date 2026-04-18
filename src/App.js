import { useState } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("generate");

  // Generate states
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("blog");

  // Summarize states
  const [text, setText] = useState("");

  // Shared states
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "https://contentflow-production-81fd.up.railway.app/api/content";

  const handleGenerate = async () => {
    if (topic.trim() === "") {
      setError("Please enter a topic");
      return;
    }
    setError("");
    setResult("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, type: contentType }),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setResult(data.content);
    } catch (err) {
      setError("Cannot connect to server. Make sure Spring Boot is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (text.trim() === "") {
      setError("Please enter text to summarize");
      return;
    }
    setError("");
    setResult("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setResult(data.summary);
    } catch (err) {
      setError("Cannot connect to server. Make sure Spring Boot is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    alert("Copied to clipboard!");
  };

  const handleClear = () => {
    setResult("");
    setError("");
    setTopic("");
    setText("");
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>ContentFlow AI</h1>
        <p className="subtitle">Generate and summarize content using AI</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "generate" ? "tab active" : "tab"}
          onClick={() => { setActiveTab("generate"); handleClear(); }}
        >
          Generate Content
        </button>
        <button
          className={activeTab === "summarize" ? "tab active" : "tab"}
          onClick={() => { setActiveTab("summarize"); handleClear(); }}
        >
          Summarize Text
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="tab-content">
          <div className="input-group">
            <label>Topic</label>
            <input
              type="text"
              placeholder="e.g. benefits of learning Java"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>

          <div className="input-group">
            <label>Content Type</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              <option value="blog">Blog Post</option>
              <option value="social">Social Media Post</option>
              <option value="email">Email</option>
              <option value="product">Product Description</option>
            </select>
          </div>

          <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      )}

      {/* Summarize Tab */}
      {activeTab === "summarize" && (
        <div className="tab-content">
          <div className="input-group">
            <label>Paste your text below</label>
            <textarea
              placeholder="Paste any text here to summarize..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          <button className="generate-btn" onClick={handleSummarize} disabled={loading}>
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && <p className="error">{error}</p>}

      {/* Result */}
      {result && (
        <div className="result">
          <div className="result-header">
            <h3>Result</h3>
            <div className="result-actions">
              <button className="action-btn" onClick={handleCopy}>Copy</button>
              <button className="action-btn clear" onClick={handleClear}>Clear</button>
            </div>
          </div>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;