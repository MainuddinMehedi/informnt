"use client";

import { getHostname, getUrlPath, formatPublishedDate } from "@/utils/formatters";
import {
  type SourceItem,
  isPlatformResource,
  getResourceContextItem,
} from "@/helpers/chat/citations";
import { useContextDetailsModal } from "@/hooks/useContextDetailsModal";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface CitationCardProps {
  resource: SourceItem;
  inPopup?: boolean;
  onAction?: () => void;
  className?: string;
}

export function CitationCard({
  resource,
  inPopup = false,
  onAction,
  className,
}: CitationCardProps) {
  const { openContextModal } = useContextDetailsModal();

  if (resource.type === "source-document") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/60 bg-muted/60 p-3",
          inPopup ? "bg-card/90" : "",
          className,
        )}
      >
        <div className="font-semibold text-xs text-foreground">
          {resource.label}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {resource.mediaType}
          {resource.value ? ` - ${resource.value}` : ""}
        </div>
      </div>
    );
  }

  const isPlatform = isPlatformResource(resource);
  const contextItem = isPlatform ? getResourceContextItem(resource) : null;
  const isStory =
    resource.contextItem?.type === "story" ||
    resource.internalUrl?.startsWith("/stories/");

  const domain = isPlatform ? "informnt" : getHostname(resource.value);
  const publisher = resource.source || (isStory ? "informnt" : domain);
  const initial = (isStory ? "I" : publisher).slice(0, 1).toUpperCase();
  const path = isPlatform ? undefined : getUrlPath(resource.value);
  const published = formatPublishedDate(resource.published);

  const cardClasses = cn(
    "group relative flex flex-col justify-between rounded-xl border border-border/60 p-3 transition-all cursor-pointer block no-underline",
    inPopup
      ? "bg-transparent border-0 p-1"
      : "h-full bg-muted/50 hover:bg-muted/80 shadow-2xs hover:border-border",
    className,
  );

  const cardContent = (
    <div>
      <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        {resource.index && (
          <span className="flex h-4 min-w-4 px-1 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-[10px] font-bold text-primary mr-0.5">
            {resource.index}
          </span>
        )}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-background border border-border/40 text-[9px] font-bold uppercase text-foreground">
          {initial}
        </span>
        <span className="truncate font-medium text-foreground/80">
          {publisher}
        </span>

        {path && !isPlatform && (
          <span className="truncate text-muted-foreground/60 max-w-[80px]">
            &gt; {path}
          </span>
        )}

        {isPlatform ? (
          <span className="ml-auto shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
            {isStory ? "Story Cluster" : "Article"}
          </span>
        ) : (
          <HugeiconsIcon
            icon={LinkSquare01Icon}
            className="w-3 h-3 text-muted-foreground/70 ml-auto shrink-0 group-hover:text-primary transition-colors"
          />
        )}
      </div>

      <div className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
        {resource.label}
      </div>

      {(published || resource.snippet) && (
        <div className="mt-1.5 line-clamp-2 text-xs text-muted-foreground/90 leading-relaxed">
          {published ? `${published} — ` : ""}
          {resource.snippet}
        </div>
      )}
    </div>
  );

  if (isPlatform && contextItem) {
    return (
      <div
        id={resource.index ? `cite-card-${resource.index}` : undefined}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          onAction?.();
          openContextModal(contextItem);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAction?.();
            openContextModal(contextItem);
          }
        }}
        className={cardClasses}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <a
      id={resource.index ? `cite-card-${resource.index}` : undefined}
      href={resource.value}
      target="_blank"
      rel="noreferrer"
      onClick={onAction}
      className={cardClasses}
    >
      {cardContent}
    </a>
  );
}
