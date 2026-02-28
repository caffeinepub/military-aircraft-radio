import React from 'react';

interface HUDLayoutProps {
  children: React.ReactNode;
}

// Kept as a thin pass-through; decorative effects removed in the minimalist redesign.
export function HUDLayout({ children }: HUDLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.1 0.012 145)' }}>
      {children}
    </div>
  );
}
