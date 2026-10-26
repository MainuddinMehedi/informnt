import prisma from "@/lib/prisma";
import { Article } from "@/types/article";
import { TopicFinding } from "@/types/lockedTopic";
import { mapArticle, RawArticleData } from "./article/mapper";

export async function getUserBookmarkedArticles(
  userId: string,
): Promise<Article[]> {
  const articleBookmarks = await prisma.articleBookmark.findMany({
    where: { userId },
    include: {
      article: {
        include: {
          rawArticle: {
            include: {
              publisher: true,
            },
          },
          categories: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return articleBookmarks.map((b) =>
    mapArticle(b.article as unknown as RawArticleData),
  );
}

export async function getUserBookmarkedFindings(
  userId: string,
): Promise<TopicFinding[]> {
  const findingBookmarks = await prisma.findingBookmark.findMany({
    where: { userId },
    include: {
      finding: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return findingBookmarks.map((b) => b.finding) as unknown as TopicFinding[];
}
