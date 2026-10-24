"use client";

import { useEffect, useState } from "react";

interface WorkerStatusBadgeProps {
  status: string;
  heartbeatAt?: Date | string;
}

export function WorkerStatusBadge({
  status,
  heartbeatAt,
}: WorkerStatusBadgeProps) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!heartbeatAt) return;
    const checkStale = () => {
      const diff = Date.now() - new Date(heartbeatAt).getTime();
      setIsStale(diff > 2 * 60 * 1000);
    };
    checkStale();
    const interval = setInterval(checkStale, 30000);
    return () => clearInterval(interval);
  }, [heartbeatAt]);

  if (status === "RUNNING") {
    if (isStale) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          STALE HEARTBEAT
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        RUNNING
      </span>
    );
  }

  if (status === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
        SUCCESS
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
      FAILED
    </span>
  );
}
