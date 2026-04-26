"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useUser();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);

    if (isLoaded) {
      const timer = setTimeout(() => {
        setReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, pathname]);

if (!ready) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Glow spinner container */}
      <div className="relative flex items-center justify-center">
        {/* Outer soft glow ring */}
        <div className="absolute h-16 w-16 rounded-full bg-primary/10 blur-xl animate-pulse" />

        {/* Middle ring */}
        <div className="h-12 w-12 rounded-full border-2 border-muted" />

        {/* Spinning ring */}
        <div className="absolute h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

  return <>{children}</>;
}
