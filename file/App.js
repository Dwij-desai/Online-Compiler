import "./App.css";
import Editor from "@monaco-editor/react";
import { useState } from "react";

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const SubmitCode = async () => {
    setIsLoading(true);
    setOutput("⏳ Compiling...");

    try {
      const payload = {
        httpMethod: "POST",
        body: JSON.stringify({
          language: language.toLowerCase(),
          code: code,
        }),
      };

      const response = await fetch(
        "/2015-03-31/functions/function/invocations",
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
      setOutput(parsed.message || "⚠️ No output received.");
    } catch (err) {
      setOutput("❌ Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h2>Online Code Compiler</h2>

      {/* Language Selector */}
      <div style={{ marginBottom: "10px" }}>
        {["Python", "JavaScript", "Java"].map((lang) => (
          <button
            key={lang}
            style={{
              marginRight: "10px",
              background: language === lang ? "black" : "white",
              color: language === lang ? "white" : "black",
              border: "1px solid black",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => setLanguage(lang)}
          >
            {lang}
          </button>
        ))}

        <button
          onClick={SubmitCode}
          style={{
            marginLeft: "20px",
            padding: "8px 16px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isLoading ? "Compiling..." : "Submit Code"}
        </button>
      </div>

      {/* Code Editor */}
      <Editor
        height="60vh"
        theme="vs-dark"
        // list themes: "vs-dark", "light", "hc-black"
        language={language.toLowerCase()}
        value={code}
        defaultValue="# Write your code here"
        onChange={(value) => setCode(value)}
      />

      {/* Output Display */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          padding: "10px",
          marginTop: "20px",
          minHeight: "100px",
          whiteSpace: "pre-wrap",
          borderRadius: "6px",
        }}
      >
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default App;
