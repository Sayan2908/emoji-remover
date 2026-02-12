"use client";

import React, { useState, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────
interface DiffLine {
    type: "equal" | "added" | "removed";
    lineNumber: number;
    content: string;
}

interface DiffResult {
    left: DiffLine[];
    right: DiffLine[];
    similarity: number;
    totalCharsLeft: number;
    totalCharsRight: number;
    linesAdded: number;
    linesRemoved: number;
    linesUnchanged: number;
}

type DiffState = "idle" | "comparing" | "done" | "error";
type InputMode = "paste" | "upload";

// ── Component ────────────────────────────────────────────────────────
export default function CodeDiff() {
    const [inputMode, setInputMode] = useState<InputMode>("paste");
    const [textA, setTextA] = useState("");
    const [textB, setTextB] = useState("");
    const [fileNameA, setFileNameA] = useState("");
    const [fileNameB, setFileNameB] = useState("");
    const [state, setState] = useState<DiffState>("idle");
    const [result, setResult] = useState<DiffResult | null>(null);
    const [error, setError] = useState("");
    const [showResult, setShowResult] = useState(false);
    const fileRefA = useRef<HTMLInputElement>(null);
    const fileRefB = useRef<HTMLInputElement>(null);

    const handleFileUpload = useCallback(
        async (
            e: React.ChangeEvent<HTMLInputElement>,
            side: "left" | "right"
        ) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const content = await file.text();
            if (side === "left") {
                setTextA(content);
                setFileNameA(file.name);
            } else {
                setTextB(content);
                setFileNameB(file.name);
            }
        },
        []
    );

    const handleCompare = async () => {
        if (!textA.trim() && !textB.trim()) return;

        setState("comparing");
        setError("");
        setResult(null);
        setShowResult(false);

        try {
            const response = await fetch("/api/diff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ textA, textB }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Comparison failed.");
            }

            const data: DiffResult = await response.json();
            setResult(data);
            setState("done");

            // Animate result in
            setTimeout(() => setShowResult(true), 100);
        } catch (err: unknown) {
            setState("error");
            setError(err instanceof Error ? err.message : "Comparison failed.");
        }
    };

    const handleReset = () => {
        setState("idle");
        setResult(null);
        setError("");
        setShowResult(false);
        setTextA("");
        setTextB("");
        setFileNameA("");
        setFileNameB("");
    };

    // Similarity bar color
    const simColor = (result?.similarity ?? 0) >= 80
        ? "var(--green)"
        : (result?.similarity ?? 0) >= 50
            ? "var(--yellow)"
            : "var(--red)";

    return (
        <div className="tool-view">
            {/* Header */}
            <header className="tool-header">
                <h2 className="tool-header__title">Code Diff Checker</h2>
                <p className="tool-header__subtitle">
                    Paste code or upload files · Whitespace-normalized comparison · Animated diff view
                </p>
            </header>

            {/* Input mode toggle */}
            {(state === "idle" || state === "done") && (
                <div className="mode-toggle-wrapper fade-in">
                    <div className="mode-toggle">
                        <button
                            className={`mode-toggle__btn ${inputMode === "paste" ? "mode-toggle__btn--active" : ""}`}
                            onClick={() => setInputMode("paste")}
                        >
                            <span className="mode-toggle__icon">✏️</span>
                            Paste Code
                        </button>
                        <button
                            className={`mode-toggle__btn ${inputMode === "upload" ? "mode-toggle__btn--active" : ""}`}
                            onClick={() => setInputMode("upload")}
                        >
                            <span className="mode-toggle__icon">📁</span>
                            Upload Files
                        </button>
                    </div>
                </div>
            )}

            {/* Input area */}
            {(state === "idle" || state === "error") && (
                <section className="diff-input fade-in">
                    <div className="diff-input__panels">
                        {/* Left */}
                        <div className="diff-input__panel">
                            <div className="diff-input__panel-header">
                                <span className="diff-input__label">
                                    {fileNameA || "File A (Left)"}
                                </span>
                                {inputMode === "upload" && (
                                    <>
                                        <button
                                            className="btn btn--small"
                                            onClick={() => fileRefA.current?.click()}
                                        >
                                            Choose File
                                        </button>
                                        <input
                                            ref={fileRefA}
                                            type="file"
                                            style={{ display: "none" }}
                                            onChange={(e) => handleFileUpload(e, "left")}
                                        />
                                    </>
                                )}
                            </div>
                            <textarea
                                className="diff-input__textarea"
                                placeholder={
                                    inputMode === "paste"
                                        ? "Paste your first code here…"
                                        : "Upload a file or paste code…"
                                }
                                value={textA}
                                onChange={(e) => setTextA(e.target.value)}
                                spellCheck={false}
                            />
                        </div>

                        {/* Divider */}
                        <div className="diff-input__divider">
                            <span className="diff-input__vs">VS</span>
                        </div>

                        {/* Right */}
                        <div className="diff-input__panel">
                            <div className="diff-input__panel-header">
                                <span className="diff-input__label">
                                    {fileNameB || "File B (Right)"}
                                </span>
                                {inputMode === "upload" && (
                                    <>
                                        <button
                                            className="btn btn--small"
                                            onClick={() => fileRefB.current?.click()}
                                        >
                                            Choose File
                                        </button>
                                        <input
                                            ref={fileRefB}
                                            type="file"
                                            style={{ display: "none" }}
                                            onChange={(e) => handleFileUpload(e, "right")}
                                        />
                                    </>
                                )}
                            </div>
                            <textarea
                                className="diff-input__textarea"
                                placeholder={
                                    inputMode === "paste"
                                        ? "Paste your second code here…"
                                        : "Upload a file or paste code…"
                                }
                                value={textB}
                                onChange={(e) => setTextB(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="diff-error">{error}</p>
                    )}

                    <div className="actions" style={{ marginTop: 16 }}>
                        <button
                            className="btn btn--primary"
                            onClick={handleCompare}
                            disabled={!textA.trim() && !textB.trim()}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3v18" />
                                <rect x="2" y="6" width="8" height="12" rx="1" />
                                <rect x="14" y="6" width="8" height="12" rx="1" />
                            </svg>
                            Compare
                        </button>
                    </div>
                </section>
            )}

            {/* Comparing animation */}
            {state === "comparing" && (
                <section className="processing-section fade-in">
                    <div className="spinner" />
                    <p className="processing-text">Comparing files…</p>
                </section>
            )}

            {/* Result */}
            {state === "done" && result && (
                <section className={`diff-result ${showResult ? "diff-result--visible" : ""}`}>
                    {/* Summary cards */}
                    <div className="diff-summary">
                        {/* Similarity gauge */}
                        <div className="diff-summary__card diff-summary__card--wide">
                            <span className="diff-summary__label">Similarity</span>
                            <div className="similarity-bar">
                                <div
                                    className="similarity-bar__fill"
                                    style={{
                                        width: showResult ? `${result.similarity}%` : "0%",
                                        background: simColor,
                                    }}
                                />
                            </div>
                            <span className="diff-summary__big" style={{ color: simColor }}>
                                {result.similarity}%
                            </span>
                        </div>

                        <div className="diff-summary__card">
                            <span className="diff-summary__label">Total Chars (Left)</span>
                            <span className="diff-summary__value">{result.totalCharsLeft.toLocaleString()}</span>
                        </div>
                        <div className="diff-summary__card">
                            <span className="diff-summary__label">Total Chars (Right)</span>
                            <span className="diff-summary__value">{result.totalCharsRight.toLocaleString()}</span>
                        </div>
                        <div className="diff-summary__card">
                            <span className="diff-summary__label">Lines Unchanged</span>
                            <span className="diff-summary__value" style={{ color: "var(--text)" }}>
                                {result.linesUnchanged}
                            </span>
                        </div>
                        <div className="diff-summary__card">
                            <span className="diff-summary__label">Lines Added</span>
                            <span className="diff-summary__value" style={{ color: "var(--green)" }}>
                                +{result.linesAdded}
                            </span>
                        </div>
                        <div className="diff-summary__card">
                            <span className="diff-summary__label">Lines Removed</span>
                            <span className="diff-summary__value" style={{ color: "var(--red)" }}>
                                -{result.linesRemoved}
                            </span>
                        </div>
                    </div>

                    {/* Diff panels */}
                    <div className="diff-panels">
                        {/* Left panel */}
                        <div className="diff-panel">
                            <div className="code-panel__header">
                                <span className="code-panel__dot code-panel__dot--red" />
                                <span className="code-panel__dot code-panel__dot--yellow" />
                                <span className="code-panel__dot code-panel__dot--green" />
                                <span className="code-panel__title">{fileNameA || "File A"}</span>
                            </div>
                            <div className="diff-panel__body">
                                {result.left.map((line, idx) => (
                                    <div
                                        key={`l-${idx}`}
                                        className={`diff-line diff-line--${line.type} ${showResult ? "diff-line--visible" : ""}`}
                                        style={{ animationDelay: `${Math.min(idx * 15, 2000)}ms` }}
                                    >
                                        <span className="diff-line__num">{line.lineNumber}</span>
                                        <span className="diff-line__marker">
                                            {line.type === "removed" ? "−" : " "}
                                        </span>
                                        <span className="diff-line__content">{line.content || " "}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right panel */}
                        <div className="diff-panel">
                            <div className="code-panel__header">
                                <span className="code-panel__dot code-panel__dot--red" />
                                <span className="code-panel__dot code-panel__dot--yellow" />
                                <span className="code-panel__dot code-panel__dot--green" />
                                <span className="code-panel__title">{fileNameB || "File B"}</span>
                            </div>
                            <div className="diff-panel__body">
                                {result.right.map((line, idx) => (
                                    <div
                                        key={`r-${idx}`}
                                        className={`diff-line diff-line--${line.type} ${showResult ? "diff-line--visible" : ""}`}
                                        style={{ animationDelay: `${Math.min(idx * 15, 2000)}ms` }}
                                    >
                                        <span className="diff-line__num">{line.lineNumber}</span>
                                        <span className="diff-line__marker">
                                            {line.type === "added" ? "+" : " "}
                                        </span>
                                        <span className="diff-line__content">{line.content || " "}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="actions">
                        <button className="btn btn--secondary" onClick={handleReset}>
                            Compare Again
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}
