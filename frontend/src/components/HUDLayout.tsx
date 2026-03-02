import React from 'react';

interface HUDLayoutProps {
  children: React.ReactNode;
}

export function HUDLayout({ children }: HUDLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
