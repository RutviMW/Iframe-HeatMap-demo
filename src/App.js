
import { useEffect, useRef, useState } from "react";

const STATIC_HEATMAP_DATA = [
  { xpath: '//*[@id="primaryBtn"]', clicks: 30 },
  { xpath: '//*[@id="searchInput"]', clicks: 15 },
  { xpath: '//*[@id="topLink"]', clicks: 8 },

  { xpath: '//*[@id="bottomBtn"]', clicks: 22 },
];

export default function App() {
  const iframeRef = useRef(null);
  const canvasRef = useRef(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const iframe = iframeRef.current;

    const handleLoad = () => {
      const iframeEl = iframeRef.current;

      const tryInject = () => {
        const doc =
          iframeEl.contentDocument || iframeEl.contentWindow?.document;

        if (!doc || !doc.body) {
          setTimeout(tryInject, 50);
          return;
        }

        const canvas = doc.createElement("canvas");
        canvasRef.current = canvas;

        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "9999";

        canvas.width = doc.documentElement.scrollWidth;
        canvas.height = doc.documentElement.scrollHeight;

        doc.body.appendChild(canvas);

        drawHeatmap(doc, canvas);
        updateVisibility();
      };

      tryInject();
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, []);

  useEffect(() => {
    updateVisibility();
  }, [showHeatmap]);

  const updateVisibility = () => {
    if (canvasRef.current) {
      canvasRef.current.style.display = showHeatmap ? "block" : "none";
    }
  };

  const drawHeatmap = (doc, canvas) => {
    const ctx = canvas.getContext("2d");

    STATIC_HEATMAP_DATA.forEach(({ xpath, clicks }) => {
      const result = doc.evaluate(
        xpath,
        doc,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      for (let i = 0; i < result.snapshotLength; i++) {
        const el = result.snapshotItem(i);
        const rect = el.getBoundingClientRect();

        const x = rect.left + rect.width / 2 + doc.defaultView.scrollX;
        const y = rect.top + rect.height / 2 + doc.defaultView.scrollY;

        drawHeatSpot(ctx, x, y, clicks);
      }
    });
  };

  const drawHeatSpot = (ctx, x, y, intensity) => {
    const radius = 20 + intensity;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,0,0,0.6)");
    gradient.addColorStop(1, "rgba(255,0,0,0)");  

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
  <div>
    <div
      style={{
        padding: 10,
        borderRadius: 6,
      }}
    >
      <label>
        <input
          type="checkbox"
          checked={showHeatmap}
          onChange={() => setShowHeatmap((p) => !p)}
        />
        Show Heatmap
      </label>
    </div>

    <div
      style={{
        width: 700,
        height: 500,
        border: "1px solid #ccc",
        position: "relative",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <iframe
        ref={iframeRef}
        src="/test.html"
        title="heatmap"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  </div>
);

}