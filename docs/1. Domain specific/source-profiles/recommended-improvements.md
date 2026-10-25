# G. Recommended Improvements

**Status:** DRAFT · **Scope:** recommendations only; nothing in this report was implemented.

The catalog work exposed platform issues that are more important than adding more publishers. These are ordered by operational risk.

| Priority | Improvement | What to change | Why it matters | Acceptance signal | Likely area |
|---|---|---|---|---|---|
| P0 | Freshness gate | Compute newest item age per feed and block ingestion when a daily publisher is older than a configurable threshold. | WSJ, Daily Star and TBS can silently feed old content into clustering. | Stale feeds are flagged and excluded before article insert. | ingestion-service/newsPipeline/rss.js; feed health worker |
| P0 | Preserve unknown dates | Store `null` instead of `new Date()` when RSS has no date; add `dateSource` provenance. | Nikkei and other undated feeds would look current and distort recency/clustering. | No article gets ingest time as `publishedAt` unless explicitly marked `fetched-fallback`. | rss.js; Prisma Article fields |
| P1 | Feed health dashboard | Track last success, HTTP status, parser warning, entry count and newest item age per feed. | Operators cannot see the difference between “valid XML” and “stale content”. | Admin view shows health per feed and alerts on regressions. | Admin UI; health-monitor worker |
| P1 | Publisher grouping | Separate publisher identity from feed URL so multiple feeds (Bloomberg markets/politics) count as one source. | Portfolio counts and bias weighting can double-count one newsroom. | Profiles and UI group feeds under a publisher ID. | Prisma FeedSource; catalog ingestion |
| P1 | Canonical source taxonomy | Extend enums for public service, cooperative, non-profit, wire service, state-controlled and state-funded public broadcaster. | Current enums collapse TASS and ABC Australia into `State Media`. | Taxonomy supports the distinctions in the template and profiles. | prisma/schema.prisma; frontend canonical constants |
| P1 | Region model | Add explicit `sourceRegion` separate from `sourceCountry`; reconcile `International`/`Global` and `South America`/`Latin America`. | Regional coverage reports are unreliable when country and region are conflated. | One documented vocabulary used by schema, UI and research. | Prisma; frontend; SOP/template |
| P1 | Activation workflow | Add `candidate → active → paused → retired` states with reviewer and review date. | Research recommendations currently have no safe path into production. | Every feed has an owner, state and review date. | Admin UI; FeedSource |
| P1 | Evidence links in admin | Attach evidence IDs and last-verified dates to publisher records. | Classifications cannot be audited from the UI. | Each publisher shows evidence and uncertainty links. | Admin UI; research JSON ingestion |
| P2 | Conditional fetching | Use ETag/Last-Modified, timeouts and retry/backoff. | Reduces load and makes failures diagnosable. | Fetch logs show conditional-hit rate and retry outcomes. | rss.js |
| P2 | Parser warning telemetry | Capture feedparser/bozo-equivalent warnings and malformed-XML counts. | Irrawaddy already shows a warning; silent failures are likely. | Warnings are visible per feed and trended. | rss.js; monitoring |
| P2 | Paywall/access flags | Record paywall and bot-protection status separately from feed validity. | A feed can be technically valid but practically unusable. | Registry distinguishes `blocked`, `paywalled` and `stale`. | Registry schema; admin |
| P2 | Contract tests for catalog | Validate required template fields, unique slugs, evidence references and feed-row traceability in CI. | Manual checks will drift as the catalog grows. | CI fails on missing fields, orphan evidence or duplicate slugs. | CI; scripts |
| P2 | Licensed wire integration | Evaluate a licensed Reuters/AP API rather than scraping or inventing RSS URLs. | The two most important wires are currently unavailable. | A documented API path or an explicit decision not to ingest them. | Ingestion + procurement |

## Sequencing

1. **Before any new activation:** freshness gate, null-date handling, and feed-health visibility.
2. **Before the next research cycle:** canonical taxonomy, source-region model, publisher grouping.
3. **Before scaling the catalog:** evidence links in admin, activation workflow, CI contract tests.
4. **Strategic:** licensed wire access and paywall/access flags.

## What not to do

- Do not solve stale feeds by lowering the freshness threshold.
- Do not treat a valid XML response as proof of current content.
- Do not map every public broadcaster to the same `State Media` value as TASS.
- Do not count multiple feeds from one publisher as independent sources.
- Do not activate the 60-profile catalog wholesale.
