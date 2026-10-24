"use client";

import { getArticleDetails } from "@/app/actions/articleActions";
import { getStoryDetails } from "@/app/actions/storyActions";
import { ArticleDetailView } from "@/components/articles/ArticleDetailView";
import { StoryDetailView } from "@/components/stories/StoryDetailView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ContextItem } from "@/types/chat";
import { Loading03Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useContextDetailsModal } from "@/hooks/useContextDetailsModal";

interface ContextDetailsModalProps {
  contextItem?: ContextItem | null;
  onClose?: () => void;
}

type ContextDetailResult = {
  article?: Parameters<typeof ArticleDetailView>[0]["article"];
  story?: Parameters<typeof StoryDetailView>[0]["story"];
  sources?: Parameters<typeof StoryDetailView>[0]["sources"];
  origins?: Parameters<typeof StoryDetailView>[0]["origins"];
  error?: string;
};

export function ContextDetailsModal({
  contextItem: externalContextItem,
  onClose: externalOnClose,
}: ContextDetailsModalProps = {}) {
  const { viewingItem, closeContextModal } = useContextDetailsModal();

  const isControlled = externalContextItem !== undefined;
  const contextItem = isControlled ? externalContextItem : viewingItem;
  const onClose = isControlled ? (externalOnClose ?? (() => {})) : closeContextModal;

  const isOpen = !!contextItem;
  const fullPageUrl = contextItem
    ? contextItem.type === "story"
      ? `/stories/${contextItem.id}`
      : `/article/${contextItem.id}`
    : "#";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[85vw] sm:max-w-[85vw] h-[90dvh] sm:h-[90vh] p-0 overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50 scrollbar-sleek flex flex-col">
        <DialogTitle className="sr-only">
          {contextItem?.title || "Details"}
        </DialogTitle>

        <DialogDescription className="sr-only">
          Context details for {contextItem?.title}
        </DialogDescription>

        {contextItem && (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-2.5 sm:px-6 bg-muted/20 pr-12">
              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mr-2">
                <span className="capitalize font-semibold text-foreground">
                  {contextItem.type || "Article"} Preview
                </span>
                <span>•</span>
                <span className="truncate max-w-[200px] sm:max-w-md">
                  {contextItem.title}
                </span>
              </div>
              <Link
                href={fullPageUrl}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors shrink-0"
              >
                <span>Open full page</span>
                <HugeiconsIcon icon={LinkSquare01Icon} className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ContextDetailsModalContent
              key={`${contextItem.type}-${contextItem.id}`}
              contextItem={contextItem}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContextDetailsModalContent({
  contextItem,
}: {
  contextItem: ContextItem;
}) {
  const [data, setData] = useState<ContextDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res =
          contextItem.type === "story"
            ? await getStoryDetails(contextItem.id)
            : await getArticleDetails(contextItem.id);

        if (!isMounted) return;

        if (res?.error) {
          setError(res.error);
        } else {
          setData(res as ContextDetailResult);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [contextItem]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full">
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-muted-foreground space-y-4">
          <HugeiconsIcon
            icon={Loading03Icon}
            className="w-8 h-8 animate-spin text-primary"
          />
          <p className="text-sm font-medium">Loading details...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-destructive space-y-2">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        contextItem.type === "story" && data.story ? (
          <StoryDetailView
            story={data.story}
            sources={data.sources || []}
            origins={data.origins || []}
            slug={contextItem.id}
          />
        ) : data.article ? (
          <ArticleDetailView article={data.article} isModal={true} />
        ) : null
      )}
    </div>
  );
}
