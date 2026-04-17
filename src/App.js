import { useState } from "react";
import "./App.css";

function App() {
  // State variables - data that can change
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("blog");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // This function runs when user clicks Generate
  const handleGenerate = async () => {

    // Validate input
    if (topic.trim() === "") {
      setError("Please enter a topic");
      return;
    }

    // Reset states before new request
    setError("");
    setResult("");
    setLoading(true);

    try {
      // Call YOUR Spring Boot backend
      const response = await fetch("http://localhost:8080/api/content/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          type: contentType,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.content);
      }

    } catch (err) {
      setError("Cannot connect to server. Make sure Spring Boot is running.");
    } finally {
      setLoading(false);
    }
  };

  // This is what gets displayed on screen
  return (
    <div className="container">
      <h1>ContentFlow AI</h1>
      <p className="subtitle">Generate content using AI</p>

      {/* Topic Input */}
      <div className="input-group">
        <label>Topic</label>
        <input
          type="text"
          placeholder="e.g. benefits of learning Java"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      {/* Content Type Dropdown */}
      <div className="input-group">
        <label>Content Type</label>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
        >
          <option value="blog">Blog Post</option>
          <option value="social">Social Media Post</option>
          <option value="email">Email</option>
          <option value="product">Product Description</option>
        </select>
      </div>

      {/* Generate Button */}
      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* Error Message */}
      {error && <p className="error">{error}</p>}

      {/* Result */}
      {result && (
        <div className="result">
          <h3>Generated Content:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;