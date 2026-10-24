"use client";

import { useState } from "react";
import { type UIMessage } from "ai";
import { getMessageSources } from "@/helpers/chat/citations";
import { CitationCard } from "./CitationCard";

interface CitationsStripProps {
  messageParts: UIMessage["parts"];
}

export function CitationsStrip({ messageParts }: CitationsStripProps) {
  const [showAll, setShowAll] = useState(false);

  const allSources = getMessageSources(messageParts);

  if (allSources.length === 0) return null;

  const visibleSources = showAll ? allSources : allSources.slice(0, 3);
  const toolLabel =
    allSources
      .find((source) => source.toolName)
      ?.toolName?.replace(/_/g, " ") ?? "source";
  const engineLabel = allSources.find((source) => source.engine)?.engine;

  return (
    <div className="mt-5 w-full">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-sleek">
        {visibleSources.map((src, idx) => (
          <div key={`${src.value}-${idx}`} className="w-[280px] shrink-0">
            <CitationCard resource={src} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          References ({allSources.length} source{allSources.length === 1 ? "" : "s"}
          {engineLabel
            ? ` via ${engineLabel}`
            : toolLabel === "search articles"
              ? " from informnt archive"
              : toolLabel === "get story details"
                ? " from tracked story"
                : ""}
          )
        </span>
        {allSources.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-medium"
          >
            {showAll ? "Show less" : `View all (${allSources.length})`}
            <span aria-hidden="true">-&gt;</span>
          </button>
        )}
      </div>
    </div>
  );
}
