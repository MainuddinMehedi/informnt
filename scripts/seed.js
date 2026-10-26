import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../ingestion-service/db/prisma.js";
import { NotificationType } from "../shared/prisma-client/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🌱 Starting Database Seeding...\n");

  // 1. Seed Categories --------------------------------------------------
  const canonicalPath = path.join(
    __dirname,
    "../frontend/constants/canonical.json",
  );
  const canonicalData = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));

  console.log(`📌 Seeding Categories (${canonicalData.categories.length})...`);
  let categoryCount = 0;

  for (const category of canonicalData.categories) {
    await prisma.category.upsert({
      where: { name: category },
      update: {},
      create: { name: category },
    });
    categoryCount++;
  }

  console.log(`✅ Seeded ${categoryCount} categories.\n`);

  // 2. Seed Publishers ---------------------------------------------------
  const publishersPath = path.join(
    __dirname,
    "../ingestion-service/data/publishers.json",
  );

  let publishersData = [];
  if (fs.existsSync(publishersPath)) {
    publishersData = JSON.parse(fs.readFileSync(publishersPath, "utf8"));
  } else {
    console.warn("⚠️  publishers.json not found. Skipping Publishers seeding.");
  }

  console.log(`📌 Seeding Publishers (${publishersData.length})...`);
  let publisherCount = 0;

  // Build a map of feedUrl -> publisherSlug & metadata for FeedSource linkage
  const feedUrlToPublisherSlug = new Map();

  for (const pub of publishersData) {
    const slug = pub.facts.identity.slug;
    const name = pub.facts.identity.name;
    const website = pub.facts.identity.website || null;
    const publisherCountry = pub.facts.identity.publisherCountry || "Global";
    const sourceRegion = pub.classifications?.sourceRegion || "Global";
    const ownershipType = pub.classifications?.ownershipType || "Commercial";
    const publisherType = pub.classifications?.publisherType || "Newspaper";
    const editorialStyle = pub.classifications?.editorialStyle || null;
    const coverageScope = pub.classifications?.coverageScope || "Global";
    const originality = pub.classifications?.originality || null;
    const politicalLeaning = pub.assessments?.politicalLeaning?.value || null;
    const economicPerspective =
      pub.assessments?.economicPerspective?.value || null;
    const reliability = pub.assessments?.reliability?.value || null;
    const reliabilityConfidence =
      pub.assessments?.reliability?.confidence != null
        ? Number(pub.assessments.reliability.confidence)
        : null;
    const stateFunded = Boolean(pub.facts.ownership?.stateFunded);

    await prisma.publisher.upsert({
      where: { slug: slug },
      update: {
        name,
        website,
        publisherCountry,
        sourceRegion,
        ownershipType,
        publisherType,
        editorialStyle,
        coverageScope,
        originality,
        politicalLeaning,
        economicPerspective,
        reliability,
        reliabilityConfidence,
        stateFunded,
        profile: pub,
      },
      create: {
        slug,
        name,
        website,
        publisherCountry,
        sourceRegion,
        ownershipType,
        publisherType,
        editorialStyle,
        coverageScope,
        originality,
        politicalLeaning,
        economicPerspective,
        reliability,
        reliabilityConfidence,
        stateFunded,
        profile: pub,
      },
    });

    publisherCount++;

    if (Array.isArray(pub.feeds)) {
      for (const feed of pub.feeds) {
        if (feed.url) {
          feedUrlToPublisherSlug.set(feed.url, {
            publisherSlug: slug,
            category: feed.category || null,
            feedType: feed.feedType || "RSS 2.0",
          });
        }
      }
    }
  }

  console.log(`✅ Seeded ${publisherCount} publishers.\n`);

  // 3. Seed FeedSources -------------------------------------------------
  const feedsPath = path.join(
    __dirname,
    "../ingestion-service/data/feeds.json",
  );

  let feedsData = [];
  if (fs.existsSync(feedsPath)) {
    feedsData = JSON.parse(fs.readFileSync(feedsPath, "utf8"));
  } else {
    console.warn("⚠️  feeds.json not found. Skipping FeedSources seeding.");
  }

  console.log(`📌 Seeding FeedSources (${feedsData.length})...`);
  let feedCount = 0;

  for (const feed of feedsData) {
    const meta = feedUrlToPublisherSlug.get(feed.url) || {};

    await prisma.feedSource.upsert({
      where: { url: feed.url },
      update: {
        name: feed.name,
        sourceCountry: feed.sourceCountry,
        sourceType: feed.sourceType,
        biasGroup: feed.biasGroup,
        coverageScope: feed.coverageScope,
        enabled: feed.enabled,
        publisherSlug: meta.publisherSlug || null,
        category: meta.category || null,
        feedType: meta.feedType || null,
      },
      create: {
        name: feed.name,
        url: feed.url,
        sourceCountry: feed.sourceCountry,
        sourceType: feed.sourceType,
        biasGroup: feed.biasGroup,
        coverageScope: feed.coverageScope,
        enabled: feed.enabled,
        publisherSlug: meta.publisherSlug || null,
        category: meta.category || null,
        feedType: meta.feedType || null,
      },
    });
    feedCount++;
  }
  console.log(`✅ Seeded ${feedCount} feed sources.\n`);

  // 4. Backfill existing RawArticles with publisherSlug -------------------
  console.log(`📌 Linking existing RawArticles to Publisher records...`);
  const activeFeeds = await prisma.feedSource.findMany({
    where: { publisherSlug: { not: null } },
    select: { name: true, publisherSlug: true },
  });

  let backfillCount = 0;
  for (const src of activeFeeds) {
    const res = await prisma.rawArticle.updateMany({
      where: {
        source: src.name,
        publisherSlug: null,
      },
      data: {
        publisherSlug: src.publisherSlug,
      },
    });
    backfillCount += res.count;
  }
  console.log(
    `✅ Linked ${backfillCount} historical raw articles to their publisher.\n`,
  );

  // 5. Seed System Settings ----------------------------------------------
  const settingsPath = path.join(
    __dirname,
    "../ingestion-service/data/system-settings.json",
  );
  const settingsData = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

  console.log(`📌 Seeding System Settings...`);
  for (const [key, value] of Object.entries(settingsData)) {
    await prisma.systemSetting.upsert({
      where: { key: key },
      update: { value: value },
      create: {
        key: key,
        value: value,
        description: "Default AI Configuration",
      },
    });
  }
  console.log(`✅ Seeded system settings.\n`);

  // 6. Seed AdminNotificationConfig Defaults ----------------------------------------------
  console.log(`📌 Seeding AdminNotificationConfig...`);

  const notificationTypes = Object.values(NotificationType);
  let notifCount = 0;

  for (const type of notificationTypes) {
    await prisma.adminNotificationConfig.upsert({
      where: { type: type },
      update: {},
      create: {
        type: type,
        inAppEnabled: true,
        discordEnabled: false,
        telegramEnabled: false,
        cooldownMinutes: 60,
      },
    });
    notifCount++;
  }
  console.log(`✅ Seeded ${notifCount} admin notification configs.\n`);

  console.log("🌟 Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
