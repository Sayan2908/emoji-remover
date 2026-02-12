"use client";

import React, { useState } from "react";
import Navbar, { ActiveTool } from "./components/Navbar";
import EmojiRemover from "./components/EmojiRemover";
import CodeDiff from "./components/CodeDiff";

export default function Home() {
  const [activeTool, setActiveTool] = useState<ActiveTool>("emoji");

  return (
    <>
      <Navbar activeTool={activeTool} onToolChange={setActiveTool} />
      <main className="app">
        {activeTool === "emoji" && <EmojiRemover />}
        {activeTool === "diff" && <CodeDiff />}
      </main>
    </>
  );
}
