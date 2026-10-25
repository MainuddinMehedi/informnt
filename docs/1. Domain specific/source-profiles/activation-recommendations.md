# F. Activation Recommendations

**Status:** DRAFT · **Decision date:** 2026-10-25 · **Not a production change**

## Executive decision

- **Keep the 25 healthy existing feeds active.**
- **Removed the two stale existing feeds from production:** WSJ and The Daily Star were removed from `feeds.json` until fresh endpoints are discovered; keep Nikkei only with an explicit date-quality caveat.
- **Start a controlled first batch of new candidates.** Do not enable all 32 new feed rows at once.
- **Do not activate Reuters or AP.** They have no verified public RSS.
- **Use TASS only as a clearly labelled state-media comparison source**, never as a verification source for contested events. Iran International and VnExpress should enter only with monitoring and explicit alignment notes.

## Existing feeds

| Publisher | Slug | Validation | Action | Latest | Reason |
|---|---|---|---|---|---|
| UN News | un-news | VALIDATED | keep_active | 2026-10-23T06:00:00+00:00 | 30 items in validation sample; returns valid RSS. |
| Foreign Policy | foreign-policy | VALIDATED | keep_active | 2026-10-23T14:22:10+00:00 | 25 items; valid RSS. |
| The Diplomat | the-diplomat | VALIDATED | keep_active | 2026-10-23T12:05:00+00:00 | 96 items; valid RSS. |
| BBC News | bbc-news | VALIDATED | keep_active | 2026-10-25T04:38:15+00:00 | 31 items; valid RSS. |
| The Guardian | the-guardian | VALIDATED | keep_active | 2026-10-23T07:57:11+00:00 | 45 items; valid RSS. |
| Deutsche Welle | deutsche-welle | VALIDATED | keep_active | 2026-10-25T04:42:00+00:00 | 130 items; valid RSS. |
| France 24 | france-24 | VALIDATED | keep_active | 2026-10-25T04:36:42+00:00 | 24 items; valid RSS. |
| The New York Times | new-york-times | VALIDATED | keep_active | 2026-10-25T03:01:45+00:00 | 52 items; valid RSS. |
| The Wall Street Journal | wall-street-journal | STALE | removed_stale | 2025-01-27T13:23:00+00:00 | Last item January 2025; removed from active feeds until fresh endpoint or API access is available. |
| NPR | npr | VALIDATED | keep_active | 2026-10-25T01:15:00+00:00 | 10 items; valid RSS. |
| Politico | politico | VALIDATED | keep_active | 2026-10-24T09:19:56+00:00 | 30 items; valid RSS. |
| TechCrunch | techcrunch | VALIDATED | keep_active | 2026-10-24T14:46:34+00:00 | 20 items; valid RSS. |
| CBC News | cbc-news | VALIDATED | keep_active | 2026-10-24T06:32:42+00:00 | 20 items; valid RSS. |
| Nikkei Asia | nikkei-asia | VALIDATED_NO_DATES | keep_active_with_date_caveat | — | 50 items parse but publication dates are absent; pipeline date fallback would distort recency. |
| The Japan Times | the-japan-times | VALIDATED | keep_active | 2026-10-25T03:00:00+00:00 | 30 items; valid RSS. |
| South China Morning Post | south-china-morning-post | VALIDATED | keep_active | 2026-10-25T04:44:17+00:00 | 50 items; valid RSS. |
| The Daily Star | the-daily-star | STALE | removed_stale | 2022-07-22T06:00:00+00:00 | Stale since 2022; removed from active feeds until fresh endpoint is available. |
| Dhaka Tribune | dhaka-tribune | VALIDATED | keep_active | 2026-10-25T04:46:42+00:00 | 100 items; valid RSS. |
| The Hindu | the-hindu | VALIDATED | keep_active | 2026-10-25T04:45:44+00:00 | 60 items; valid RSS. |
| The Straits Times | the-straits-times | VALIDATED | keep_active | 2026-10-25T04:10:33+00:00 | 50 items; valid RSS. |
| Yonhap News Agency | yonhap | VALIDATED | keep_active | 2026-10-25T04:30:45+00:00 | 101 items; valid RSS. |
| ABC News Australia | abc-news-australia | VALIDATED | keep_active | 2026-10-25T04:25:04+00:00 | 25 items; valid RSS. |
| Al Jazeera | al-jazeera | VALIDATED | keep_active | 2026-10-25T03:57:40+00:00 | 25 items; valid RSS. |
| Arab News | arab-news | VALIDATED | keep_active | 2026-10-25T16:38:30+00:00 | 50 items in validation sample; returns valid RSS with production crawler headers. |
| Middle East Eye | middle-east-eye | VALIDATED | keep_active | 2026-10-25T04:33:58+00:00 | 20 items; valid RSS. |
| AllAfrica | allafrica | VALIDATED | keep_active | 2026-10-23T06:45:53+00:00 | 33 items; valid RSS/RDF. |
| Buenos Aires Times | buenos-aires-times | VALIDATED | keep_active | 2026-10-24T06:14:55+00:00 | 100 items; valid RSS. |

### Existing-feed interpretation

- **WSJ** is a valid RSS document but its newest item is 2025-01-27. It fails freshness, not syntax.
- **The Daily Star** frontpage feed is stale since 2022; the alternate `/rss.xml` is newer but still stale and only eight items. Neither is safe.
- **Arab News** was initially blocked in a basic script environment via Cloudflare 403, but is fully verified returning HTTP 200 with 50 fresh items under production browser headers. Kept active.
- **Nikkei Asia** parses 50 items without dates. The current pipeline falls back to ingest time, which can make old stories look new and distort clustering. This needs a code-level fix, not just a feed swap.
- **Irrawaddy** is new and valid but emitted a parser warning; monitor for malformed XML before promoting it beyond a limited batch.

## New publisher actions

| Publisher | Slug | Validation | Action | Latest | Reason |
|---|---|---|---|---|---|
| The Economist | the-economist | VALIDATED | activate_candidate | 2026-10-24T04:53:01+00:00 | 300 items; valid RSS; headline/summary feed rather than full articles. |
| Financial Times | financial-times | VALIDATED | activate_candidate | 2026-10-24T23:00:11+00:00 | 25 items; valid RSS; paywalled article bodies. |
| Bloomberg News | bloomberg | VALIDATED | activate_candidate | 2026-10-25T04:00:00+00:00 | 20 items; valid RSS. |
| Bloomberg News | bloomberg | VALIDATED | activate_candidate | 2026-10-25T00:00:00+00:00 | 19 items; valid RSS. |
| ProPublica | propublica | VALIDATED | activate_candidate | 2026-10-24T22:00:00+00:00 | 20 items; valid RSS. |
| Mongabay | mongabay | VALIDATED | activate_candidate | 2026-10-24T09:14:17+00:00 | 32 items; valid RSS. |
| Carbon Brief | carbon-brief | VALIDATED | activate_candidate | 2026-10-23T09:55:26+00:00 | 12 items; valid RSS. |
| Prothom Alo | prothom-alo | VALIDATED | activate_candidate | 2026-10-25T04:42:41+00:00 | 15 items; valid RSS. |
| The Business Standard | business-standard-bd | STALE | do_not_activate | 2021-11-12T17:30:00+00:00 | 10 items; valid XML but stale since November 2021; do not activate. |
| The Indian Express | indian-express | VALIDATED | activate_candidate | 2026-10-25T04:35:41+00:00 | 200 items; valid RSS. |
| Scroll.in | scroll-in | VALIDATED | activate_candidate | 2026-10-25T10:21:11+00:00 | 100 items; valid FeedBurner RSS; primary scroll.in/feed was invalid. |
| Dawn | dawn | VALIDATED | activate_candidate | 2026-10-25T04:48:27+00:00 | 29 items; valid RSS. |
| The Irrawaddy | irrawaddy | VALIDATED_WITH_WARNING | activate_candidate_with_monitoring | 2026-10-23T06:13:01+00:00 | 10 items; feed parser reported bozo=True but returned dated entries. Monitor XML validity. |
| Kyodo News | kyodo-news | VALIDATED | activate_candidate | 2026-10-25T03:40:00+00:00 | 15 items; valid RSS. |
| The Korea Herald | korea-herald | VALIDATED | activate_candidate | 2026-10-25T19:45:45+00:00 | 50 items; valid RSS; primary RSS endpoint was malformed. |
| CNA | cna | VALIDATED | activate_candidate | 2026-10-25T04:33:54+00:00 | 20 items; valid RSS. |
| Bangkok Post | bangkok-post | VALIDATED | activate_candidate | 2026-10-25T04:06:00+00:00 | 10 items; valid RSS. |
| VnExpress | vnexpress | VALIDATED | activate_candidate_with_monitoring | 2026-10-25T02:58:25+00:00 | 60 items; valid RSS. |
| Rappler | rappler | VALIDATED | activate_candidate | 2026-10-25T04:20:59+00:00 | 10 items; valid RSS. |
| Focus Taiwan | focus-taiwan | VALIDATED | activate_candidate | 2026-10-25T17:07:30+00:00 | 39 items; valid FeedBurner RSS; focustaiwan.tw/rss returned 404. |
| The Times of Israel | times-of-israel | VALIDATED | activate_candidate | 2026-10-25T03:45:22+00:00 | 15 items; valid RSS. |
| +972 Magazine | 972-magazine | VALIDATED | activate_candidate | 2026-10-23T08:42:51+00:00 | 10 items; valid RSS. |
| Gulf News | gulf-news | VALIDATED | activate_candidate | 2026-10-25T14:44:55+00:00 | 29 items; valid RSS; gulfnews.com/rss returned 404. |
| Iran International | iran-international | VALIDATED | activate_candidate_with_monitoring | 2026-10-25T09:46:25+00:00 | 50 items; valid RSS; iranintl.com/en/rss returned invalid/empty. |
| Hürriyet Daily News | hurriyet-daily-news | VALIDATED | activate_candidate | 2026-10-25T05:10:00+00:00 | 64 items; valid RSS; legacy /rss endpoint returned malformed feed. |
| Al-Monitor | al-monitor | VALIDATED | activate_candidate | 2026-10-25T04:46:39+00:00 | 20 items; valid RSS. |
| The Kyiv Independent | kyiv-independent | VALIDATED | activate_candidate | 2026-10-25T09:52:48+00:00 | 15 items; valid RSS; kyivindependent.com/feed/ returned 404. |
| Meduza | meduza | VALIDATED | activate_candidate | 2026-10-24T22:42:58+00:00 | 30 items; valid RSS. |
| TASS | tass | VALIDATED | activate_as_state_media_comparison | 2026-10-25T02:31:10+00:00 | 39 items; valid RSS; state media, use only for official Russian statements and comparison. |
| Daily Maverick | daily-maverick | VALIDATED | activate_candidate | 2026-10-25T12:03:22+00:00 | 52 items; valid RSS; /feed/ returned 403. |
| Premium Times | premium-times | VALIDATED | activate_candidate | 2026-10-25T04:00:19+00:00 | 15 items; valid RSS. |
| El País English | el-pais-english | VALIDATED | activate_candidate | 2026-10-24T22:00:00+00:00 | 59 items; valid RSS. |

### Suggested first batch

Prioritise a small set with clean feeds, clear ownership and low legal/ethical risk:

1. Financial Times — global business/policy baseline.
2. The Economist — weekly analysis and framing.
3. Bloomberg markets + politics — markets and policy, with two-feed monitoring.
4. Times of Israel — Israeli national lens.
5. The Kyiv Independent — Ukraine wartime reporting.
6. Meduza — independent Russian exile reporting.
7. Daily Maverick — South African investigations.
8. Premium Times — Nigerian accountability reporting.
9. El País English — Spanish/Latin American coverage.
10. Gulf News or Hürriyet — Gulf/Turkey national depth, with monitoring.

This is a sequencing suggestion, not an automatic allow-list. Confirm feed health and editorial review before enabling.

## Rows that must not be activated

| Publisher | Slug | Reason |
|---|---|---|
| Associated Press | ap | No verified public RSS |
| Reuters | reuters | No verified public RSS |
| The Wall Street Journal | wall-street-journal | Stale since 2025-01-27 |
| The Daily Star | the-daily-star | Stale frontpage feed; alternate also stale |
| Arab News | arab-news | Cloudflare 403 |
| The Business Standard | business-standard-bd | Stale since 2021-11-12 |

## Guardrails

- Keep existing production feeds enabled only if they pass a freshness check.
- Cap the first new batch at 8–10 publishers and monitor for seven days.
- Alert on: HTTP error, zero entries, parser warning, newest item older than 7 days for a daily publisher, or a sudden 80% drop in item count.
- Do not deduplicate solely by title; compare canonical URLs and publisher attribution.
- Treat state media as a separate trust class in the UI and in ranking.
- Do not use a single feed failure to delete a publisher profile; degrade to `review` and record the evidence.
- Re-check Reuters/AP for a licensed API or official partner feed before considering them again.

## What would change this recommendation

- A fresh WSJ/Daily Star RSS endpoint.
- A browser-capable fetch path or licensed Arab News feed.
- A Nikkei feed with publication dates, or a pipeline fix that preserves `null` dates.
- A Reuters/AP licensed API.
- A peer review that materially changes a publisher’s ownership or reliability assessment.
