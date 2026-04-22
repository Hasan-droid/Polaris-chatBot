"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { buildBackendUrl } from "@/lib/env";

type HealthState = "healthy" | "unhealthy";

export function HealthBanner() {
  const [healthState, setHealthState] = useState<HealthState>("unhealthy");

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(buildBackendUrl("/health"), {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const data = (await response.json()) as { status?: string };
        if (isMounted) {
          setHealthState(data.status === "ok" ? "healthy" : "unhealthy");
        }
      } catch {
        if (isMounted) {
          setHealthState("unhealthy");
        }
      }
    };

    void checkHealth();
    const intervalId = window.setInterval(() => {
      void checkHealth();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const isHealthy = healthState === "healthy";

  return (
    <div
      className={cn(
        "fixed left-4 top-4 z-50 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg ring-1 backdrop-blur",
        isHealthy
          ? "bg-green-500/90 text-white ring-green-300/60"
          : "bg-red-500/90 text-white ring-red-300/60"
      )}
    >
      {isHealthy ? "Backend healthy" : "Backend unavailable"}
    </div>
  );
}
