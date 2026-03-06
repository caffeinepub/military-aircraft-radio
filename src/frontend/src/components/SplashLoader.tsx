import { useEffect, useState } from "react";

const PWA_IMAGE =
  "https://wkeve-6yaaa-aaaaf-qahcq-cai.raw.icp0.io/storage?contentId=kl67x-j6c5g-ptso3-xq4fe-kmcuc-trzl2-nzxqt-qjedv-j3y4m-3746e-tqe-image-29480";

interface SplashLoaderProps {
  onDone: () => void;
}

export function SplashLoader({ onDone }: SplashLoaderProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Lock body scroll so no white flashes behind the splash
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const showTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    const doneTimer = setTimeout(() => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
      onDone();
    }, 2300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, [onDone]);

  return (
    <div
      data-ocid="splash.panel"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Extend beyond safe areas / notches using env() so no gap on any device
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#0a0a0a",
        zIndex: 99999,
        overflow: "hidden",
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Full-bleed background colour so nothing shows before image loads */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0a0a0a",
        }}
      />

      {/* Full-bleed image — covers the entire screen with no letterboxing */}
      <img
        src={PWA_IMAGE}
        alt="Antenna"
        style={{
          position: "absolute",
          top: "-5%",
          left: "-5%",
          width: "110%",
          height: "110%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
        draggable={false}
      />

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
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
