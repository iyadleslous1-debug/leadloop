"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 380,
  minLeftWidth = 280,
  minRightWidth = 400,
}: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragging.current = true;
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      newWidth = Math.max(minLeftWidth, Math.min(newWidth, rect.width - minRightWidth));
      setLeftWidth(newWidth);
    }

    function handleMouseUp() {
      dragging.current = false;
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minLeftWidth, minRightWidth]);

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden" style={{ gap: 0 }}>
      <div style={{ width: leftWidth, flexShrink: 0 }} className="overflow-y-auto border-r border-zinc-800">
        {left}
      </div>
      <div
        className="w-1.5 cursor-col-resize shrink-0 bg-zinc-800/50 hover:bg-zinc-700 transition-colors"
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 overflow-y-auto min-w-0">
        {right}
      </div>
    </div>
  );
}
