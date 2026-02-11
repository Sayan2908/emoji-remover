"use client";

import React, { useEffect, useState, useRef } from "react";

interface CodePanelProps {
    title: string;
    content: string;
    animate?: boolean;
    highlightDiff?: boolean;
    originalContent?: string;
}

export default function CodePanel({
    title,
    content,
    animate = false,
    highlightDiff = false,
    originalContent = "",
}: CodePanelProps) {
    const [displayedContent, setDisplayedContent] = useState(animate ? "" : content);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (!animate) {
            setDisplayedContent(content);
            return;
        }

        setIsAnimating(true);
        setDisplayedContent("");

        let index = 0;
        const chunkSize = Math.max(1, Math.ceil(content.length / 200)); // finish in ~200 frames
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

    // Build highlighted content if needed
    const renderContent = () => {
        if (highlightDiff && originalContent && content) {
            // Character-by-character comparison to highlight removed regions
            const parts: React.ReactNode[] = [];
            let cleanIdx = 0;
            let origIdx = 0;
            const displayed = displayedContent;

            // Simple approach: highlight the original by marking emojis
            if (title.toLowerCase().includes("original")) {
                const chars = displayed.split("");
                // We'll use the emoji regex to find emoji positions
                const emojiRegex =
                    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}\u{200C}-\u{200D}\u{2028}\u{2029}\u{FE0E}-\u{FE0F}\u{E0001}-\u{E007F}]/gu;

                let lastIndex = 0;
                let match;
                const fullContent = content;
                const matches: { start: number; end: number }[] = [];
                while ((match = emojiRegex.exec(fullContent)) !== null) {
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

            return displayed;
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
            </div>
            <pre ref={containerRef} className="code-panel__body">
                <code>{renderContent()}{isAnimating && <span className="cursor-blink">▎</span>}</code>
            </pre>
        </div>
    );
}
