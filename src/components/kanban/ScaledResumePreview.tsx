"use client";

import { useEffect, useRef, useState } from "react";

import { ResumeCanvas } from "@/components/resume-builder/ResumeCanvas";

// The resume sheet (.resume-page) is a fixed 210mm (~794px) wide A4 document,
// wrapped by ResumeCanvas in a `p-8` (32px) container. So the natural rendered
// width is ~794 + 2*32 = 858px. We measure the available width and scale the
// whole canvas down so it fits with no horizontal scrollbar.
const NATURAL_WIDTH = 794 + 64;

export function ScaledResumePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const recompute = () => {
      const available = container.clientWidth;
      // Never scale up past 1; only shrink to fit narrow drawers.
      const next = available > 0 ? Math.min(1, available / NATURAL_WIDTH) : 1;
      setScale(next);
      // Reserve the right amount of vertical space for the transformed content.
      setScaledHeight(content.scrollHeight * next);
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div style={{ height: scaledHeight }}>
        <div
          ref={contentRef}
          style={{
            width: NATURAL_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <ResumeCanvas editable={false} />
        </div>
      </div>
    </div>
  );
}
