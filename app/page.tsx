"use client";

import React, { useState } from "react";
import DropZone from "./components/DropZone";
import CodePanel from "./components/CodePanel";

interface ProcessedResult {
  originalText: string;
  cleanedText: string;
  fileName: string;
  originalSize: number;
  cleanedSize: number;
  emojisRemoved: number;
}

type AppState = "idle" | "processing" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState("");
  const [animateClean, setAnimateClean] = useState(false);

  const handleFileSelected = async (file: File) => {
    setState("processing");
    setError("");
    setResult(null);
    setAnimateClean(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/remove-emoji", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong.");
      }

      const data: ProcessedResult = await response.json();
      setResult(data);
      setState("done");

      // Start cleaned text animation after a short delay
      setTimeout(() => setAnimateClean(true), 400);
    } catch (err: unknown) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to process the file.");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.cleanedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setError("");
    setAnimateClean(false);
  };

  return (
    <main className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <span className="header__icon">✦</span>
          <h1 className="header__title">Emoji Remover</h1>
        </div>
        <p className="header__subtitle">
          Upload any file · Emojis are stripped instantly · Download the clean version
        </p>
      </header>

      {/* Upload State */}
      {state === "idle" && (
        <section className="upload-section fade-in">
          <DropZone onFileSelected={handleFileSelected} isProcessing={false} />
        </section>
      )}

      {/* Processing State */}
      {state === "processing" && (
        <section className="processing-section fade-in">
          <div className="spinner" />
          <p className="processing-text">Processing your file…</p>
        </section>
      )}

      {/* Error State */}
      {state === "error" && (
        <section className="error-section fade-in">
          <div className="error-card">
            <span className="error-icon">⚠</span>
            <p className="error-text">{error}</p>
            <button className="btn btn--secondary" onClick={handleReset}>
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* Result State */}
      {state === "done" && result && (
        <section className="result-section fade-in">
          {/* Stats bar */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat__label">File</span>
              <span className="stat__value">{result.fileName}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Emojis Removed</span>
              <span className="stat__value stat__value--accent">
                {result.emojisRemoved}
              </span>
            </div>
            <div className="stat">
              <span className="stat__label">Characters Saved</span>
              <span className="stat__value">
                {result.originalSize - result.cleanedSize}
              </span>
            </div>
          </div>

          {/* Side‑by‑side panels */}
          <div className="panels">
            <CodePanel
              title={`Original — ${result.fileName}`}
              content={result.originalText}
              highlightDiff
              originalContent={result.originalText}
            />
            <CodePanel
              title={`Cleaned — ${result.fileName}`}
              content={result.cleanedText}
              animate={animateClean}
            />
          </div>

          {/* Action buttons */}
          <div className="actions">
            <button className="btn btn--primary" onClick={handleDownload}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Clean File
            </button>
            <button className="btn btn--secondary" onClick={handleReset}>
              Upload Another File
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
