import type React from "react";

interface HUDLayoutProps {
  children: React.ReactNode;
}

export function HUDLayout({ children }: HUDLayoutProps) {
  return (
    <div
      className="bg-background"
      style={{
        // Use dvh so mobile browser chrome (address bar) is excluded
        position: "fixed",
        inset: 0,
        width: "100dvw",
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
