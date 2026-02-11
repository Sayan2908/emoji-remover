"use client";

import React, { useCallback, useRef, useState } from "react";

interface DropZoneProps {
    onFileSelected: (file: File) => void;
    isProcessing: boolean;
}

export default function DropZone({ onFileSelected, isProcessing }: DropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onFileSelected(e.dataTransfer.files[0]);
                e.dataTransfer.clearData();
            }
        },
        [onFileSelected]
    );

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelected(e.target.files[0]);
        }
    };

    return (
        <div
            className={`dropzone ${isDragging ? "dropzone--active" : ""} ${isProcessing ? "dropzone--disabled" : ""}`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={inputRef}
                type="file"
                onChange={handleChange}
                style={{ display: "none" }}
                disabled={isProcessing}
            />
            <div className="dropzone__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            </div>
            <p className="dropzone__title">
                {isDragging ? "Drop it here!" : "Drag & drop any file here"}
            </p>
            <p className="dropzone__subtitle">
                or <span className="dropzone__link">browse</span> to choose a file
            </p>
            <p className="dropzone__hint">.py, .ts, .js, .csv, .json, .txt — any text file</p>
        </div>
    );
}
