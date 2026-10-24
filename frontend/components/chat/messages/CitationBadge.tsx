"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { type SourceItem } from "@/helpers/chat/citations";
import { CitationCard } from "./CitationCard";

interface CitationBadgeProps {
  index: number;
  source?: SourceItem;
}

export function CitationBadge({ index, source }: CitationBadgeProps) {
  const [open, setOpen] = useState(false);

  // If no source is available yet, render a plain non-navigating badge
  if (!source) {
    return (
      <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1.5 mx-0.5 text-[9.5px] font-bold font-mono text-muted-foreground bg-muted/50 rounded-full border border-border/60 align-super select-none">
        {index}
      </span>
    );
  }

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={150}
      closeDelay={200}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          aria-label={`Citation ${index}: ${source.label}`}
          className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1.5 mx-0.5 text-[9.5px] font-bold font-mono text-primary bg-primary/12 hover:bg-primary/25 rounded-full border border-primary/35 align-super no-underline transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          {index}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-[290px] sm:w-[320px] p-3 shadow-2xl z-50 bg-popover/95 backdrop-blur-md border-border/80 rounded-xl"
      >
        <CitationCard
          resource={source}
          inPopup={true}
          onAction={() => setOpen(false)}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
