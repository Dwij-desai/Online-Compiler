import "./App.css";
import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";

const backendUrl =
  process.env.REACT_APP_BACKEND_URL || "https://your-backend.onrender.com"; // TODO: Replace with your actual Render backend URL

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("vs-dark");

  // Default starter code for each language
  const starterCode = {
    python: "# Write your Python code here\n\nprint('Hello World')",
    javascript:
      "// Write your JavaScript code here\n\nconsole.log('Hello World');",
    java: '// Write your Java code here\n\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}',
  };

  useEffect(() => {
    setCode(starterCode[language.toLowerCase()]);
  }, [language]);

  const toggleTheme = () => {
    setTheme(theme === "vs-dark" ? "light" : "vs-dark");
  };

  const SubmitCode = async () => {
    setIsLoading(true);
    setOutput("Compiling...");

    try {
      const payload = {
        httpMethod: "POST",
        body: JSON.stringify({
          language: language.toLowerCase(),
          code: code,
        }),
      };

      const response = await fetch(
        `${backendUrl}/2015-03-31/functions/function/invocations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const parsed =
        typeof data.body === "string" ? JSON.parse(data.body) : data.body;
      setOutput(parsed.message || "No output received.");
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`app-container ${theme}`}>
      <div className="header">
        <h1>संकलक</h1>
        <div className="header-controls">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "vs-dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div className="content">
        <div className="sidebar">
          <div className="language-selector">
            <h3>Language</h3>
            {["Python", "JavaScript", "Java"].map((lang) => (
              <button
                key={lang}
                className={`language-btn ${language === lang ? "active" : ""}`}
                onClick={() => setLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            className={`run-button ${isLoading ? "loading" : ""}`}
            onClick={SubmitCode}
            disabled={isLoading}
          >
            {isLoading ? "Running..." : "Run Code"}
          </button>
        </div>

        <div className="main-content">
          <div className="editor-container">
            <Editor
              height="100%"
              theme={theme}
              language={language.toLowerCase()}
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontFamily: "'SF Mono', monospace",
                padding: { top: 10 },
              }}
            />
          </div>

          <div className="output-container">
            <div className="output-header">
              <h3>Console Output</h3>
              {isLoading && <div className="pulse"></div>}
            </div>
            <div className="output-content">
              <pre>{output}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
