import { useEffect, useState } from "react";

const PWA_IMAGE =
  "https://wkeve-6yaaa-aaaaf-qahcq-cai.raw.icp0.io/storage?contentId=kl67x-j6c5g-ptso3-xq4fe-kmcuc-trzl2-nzxqt-qjedv-j3y4m-3746e-tqe-image-29480";

interface SplashLoaderProps {
  onDone: () => void;
}

export function SplashLoader({ onDone }: SplashLoaderProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for 1.8 s then fade out over 0.5 s
    const showTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    const doneTimer = setTimeout(() => {
      onDone();
    }, 2300); // 1800 + 500 fade

    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      data-ocid="splash.panel"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        // Use dvh as well for mobile browsers with dynamic toolbars
        minHeight: "100dvh",
        backgroundColor: "#0a0a0a",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Full-bleed image — covers the entire screen */}
      <img
        src={PWA_IMAGE}
        alt="Antenna"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
        draggable={false}
      />

      {/* Subtle vignette overlay so the image doesn't feel too raw */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* App name at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.9)",
          fontFamily: '"Space Mono", monospace',
          fontSize: "1.1rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        ANTENNA
      </div>
    </div>
  );
}
