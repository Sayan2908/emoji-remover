"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface CodePanelProps {
    title: string;
    content: string;
    animate?: boolean;
    highlightDiff?: boolean;
    originalContent?: string;
    showCopy?: boolean;
}

// Broad regex for highlighting emojis in the original panel (union of simple + thorough)
const HIGHLIGHT_REGEX =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{200D}\u{20E3}\u{FE00}-\u{FE0F}\u{25A0}-\u{25FF}\u{2580}-\u{259F}\u{2500}-\u{257F}\u{00A9}\u{00AE}\u{2022}\u{203C}\u{2049}\u{2122}\u{2139}\u{2714}\u{2716}\u{2728}\u{274C}\u{274E}\u{2764}\u{27A1}\u{2934}\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

export default function CodePanel({
    title,
    content,
    animate = false,
    highlightDiff = false,
    originalContent = "",
    showCopy = false,
}: CodePanelProps) {
    const [displayedContent, setDisplayedContent] = useState(animate ? "" : content);
    const [isAnimating, setIsAnimating] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (!animate) {
            setDisplayedContent(content);
            return;
        }

        setIsAnimating(true);
        setDisplayedContent("");

        let index = 0;
        const chunkSize = Math.max(1, Math.ceil(content.length / 200));
        const interval = setInterval(() => {
            index += chunkSize;
            if (index >= content.length) {
                setDisplayedContent(content);
                setIsAnimating(false);
                clearInterval(interval);
            } else {
                setDisplayedContent(content.slice(0, index));
            }
        }, 12);

        return () => clearInterval(interval);
    }, [content, animate]);

    // Auto-scroll to bottom while animating
    useEffect(() => {
        if (containerRef.current && isAnimating) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayedContent, isAnimating]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = content;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [content]);

    // Build highlighted content if needed
    const renderContent = () => {
        if (highlightDiff && originalContent && content) {
            if (title.toLowerCase().includes("original")) {
                const displayed = displayedContent;
                const parts: React.ReactNode[] = [];

                const fullContent = content;
                const matches: { start: number; end: number }[] = [];
                let match;
                const re = new RegExp(HIGHLIGHT_REGEX.source, "gu");
                while ((match = re.exec(fullContent)) !== null) {
                    matches.push({ start: match.index, end: match.index + match[0].length });
                }

                if (matches.length > 0) {
                    let pos = 0;
                    for (const m of matches) {
                        if (m.start > pos && m.start <= displayed.length) {
                            parts.push(
                                <span key={`t-${pos}`}>{displayed.slice(pos, Math.min(m.start, displayed.length))}</span>
                            );
                        }
                        if (m.start < displayed.length) {
                            parts.push(
                                <span key={`e-${m.start}`} className="emoji-highlight">
                                    {displayed.slice(m.start, Math.min(m.end, displayed.length))}
                                </span>
                            );
                        }
                        pos = Math.min(m.end, displayed.length);
                    }
                    if (pos < displayed.length) {
                        parts.push(<span key={`r-${pos}`}>{displayed.slice(pos)}</span>);
                    }
                    return parts;
                }
            }
            return displayedContent;
        }
        return displayedContent;
    };

    return (
        <div className="code-panel">
            <div className="code-panel__header">
                <span className="code-panel__dot code-panel__dot--red" />
                <span className="code-panel__dot code-panel__dot--yellow" />
                <span className="code-panel__dot code-panel__dot--green" />
                <span className="code-panel__title">{title}</span>
                {isAnimating && <span className="code-panel__badge">typing…</span>}
                {showCopy && !isAnimating && content && (
                    <button
                        className={`copy-btn ${copied ? "copy-btn--copied" : ""}`}
                        onClick={handleCopy}
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Copied
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                )}
            </div>
            <pre ref={containerRef} className="code-panel__body">
                <code>{renderContent()}{isAnimating && <span className="cursor-blink">▎</span>}</code>
            </pre>
        </div>
    );
}
