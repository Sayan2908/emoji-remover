"use client";

import React from "react";

export type ActiveTool = "emoji" | "diff";

interface NavbarProps {
    activeTool: ActiveTool;
    onToolChange: (tool: ActiveTool) => void;
}

export default function Navbar({ activeTool, onToolChange }: NavbarProps) {
    return (
        <nav className="navbar">
            <div className="navbar__inner">
                {/* Logo */}
                <div className="navbar__brand">
                    <span className="navbar__logo-icon">◈</span>
                    <span className="navbar__logo-text">DevLens</span>
                </div>

                {/* Tabs */}
                <div className="navbar__tabs">
                    <button
                        className={`navbar__tab ${activeTool === "emoji" ? "navbar__tab--active" : ""}`}
                        onClick={() => onToolChange("emoji")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                        Emoji Remover
                    </button>
                    <button
                        className={`navbar__tab ${activeTool === "diff" ? "navbar__tab--active" : ""}`}
                        onClick={() => onToolChange("diff")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v18" />
                            <rect x="2" y="6" width="8" height="12" rx="1" />
                            <rect x="14" y="6" width="8" height="12" rx="1" />
                        </svg>
                        Code Diff
                    </button>
                </div>

                {/* Spacer for centering */}
                <div className="navbar__spacer" />
            </div>
        </nav>
    );
}
