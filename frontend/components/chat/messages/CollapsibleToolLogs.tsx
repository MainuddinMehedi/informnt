"use client";

import { SourceAvatarStack } from "@/components/ui/SourceAvatar";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getToolName, type UIMessage } from "ai";
import { useMemo, useState } from "react";
import { extractToolResources } from "@/helpers/chat/citations";
import {
  getToolQuery,
  toolRunningLabel,
  getHeaderLabel,
  isZeroResults,
} from "@/helpers/chat/toolLogs";

interface CollapsibleToolLogsProps {
  toolParts: UIMessage["parts"];
  forceCollapse?: boolean;
}

export function CollapsibleToolLogs({
  toolParts,
  forceCollapse = false,
}: CollapsibleToolLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find the first active tool (streaming or available)
  const activeTool = toolParts?.find((part) => {
    const tp = part as { state: string };
    return tp.state === "input-streaming" || tp.state === "input-available";
  });

  const isAnyToolRunning = !!activeTool;

  // Filter completed tools with output
  const doneTools = useMemo(
    () =>
      toolParts?.filter((part) => {
        const tp = part as { state: string; output?: Record<string, unknown> };
        return tp.state === "output-available" && tp.output;
      }) ?? [],
    [toolParts],
  );

  if (!toolParts || toolParts.length === 0) return null;

  // 1. If currently running a tool
  if (isAnyToolRunning && !forceCollapse) {
    const toolName = getToolName(
      activeTool as Parameters<typeof getToolName>[0],
    );
    const tp = activeTool as {
      state: string;
      input?: Record<string, unknown>;
      rawInput?: Record<string, unknown>;
    };

    const query = getToolQuery(tp.input ?? tp.rawInput);

    return (
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/70 my-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        <span className="font-medium text-foreground/80">
          {toolRunningLabel(toolName, query)}
        </span>
      </div>
    );
  }

  if (doneTools.length === 0) return null;

  const headerLabel = getHeaderLabel(doneTools);

  return (
    <div className="my-1.5">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer select-none"
      >
        <HugeiconsIcon
          icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
          className="w-3.5 h-3.5 text-muted-foreground/70"
        />
        <span>{headerLabel}</span>
      </button>

      {isExpanded && (
        <div className="border-l border-border/50 pl-3.5 ml-1.5 my-2 space-y-2">
          {doneTools.map((part, index) => {
            const tp = part as {
              input?: Record<string, unknown>;
              rawInput?: Record<string, unknown>;
              output?: Record<string, unknown>;
            };
            const query =
              getToolQuery(tp.input ?? tp.rawInput) || "Search query";
            const stepSources = extractToolResources([part]).map((s) => ({
              name: s.source || "informnt",
              url: s.value,
            }));
            const isZero = isZeroResults(tp.output);

            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 text-xs py-0.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="font-mono text-[11px] text-muted-foreground/90 truncate max-w-[500px]">
                  {query}
                </span>

                {stepSources.length > 0 ? (
                  <SourceAvatarStack
                    sources={stepSources}
                    size="sm"
                    max={4}
                    className="shrink-0"
                  />
                ) : isZero ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border bg-amber-500/10 text-amber-500/90 border-amber-500/20">
                    0 found
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
