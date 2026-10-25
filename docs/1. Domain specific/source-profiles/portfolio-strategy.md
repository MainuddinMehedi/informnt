# A. Portfolio Strategy

**Status:** DRAFT · **Research date:** 2026-10-25 · **Review date:** 2026-11-08

## Thesis

The catalog is built as three complementary layers rather than a list of famous brands:

1. **Global baseline** — wires and international publications that provide fast, broad event coverage and cross-border context.
2. **National depth** — English-language national publishers that explain domestic politics, business and society from inside the country.
3. **Regional and specialist scrutiny** — conflict, human-rights, climate, investigative and policy specialists that cover what broad wires under-report.

The purpose is not to maximise volume. It is to give Informnt enough independent, attributable coverage to detect a story, compare framings, and avoid treating a single national lens as the world.

## Composition

| Dimension | Distribution |
|---|---|
| Region | Asia-Pacific 23, Europe 13, North America 12, Middle East 7, Africa 3, South America 1, Global 1 |
| Ownership type | Commercial 39, Non-profit 7, Public Service 7, State 4, Cooperative 3 |
| Publisher type | Newspaper 21, Digital Native 17, Broadcaster 9, Wire Service 6, Magazine 5, Government Agency 2 |
| Coverage scope | National 25, Global 19, Regional 12, International 4 |
| Assessed leaning | Centre 36, Centre-Left 15, Centre-Right 6, State-Aligned 2, Left 1 |
| Reliability | High 48, Medium 11, Low 1 |

### Regional allocation

| Region | Profiles |
|---|---|
| Global / multi-region | 1 |
| Asia-Pacific | 23 |
| Europe | 13 |
| Middle East | 7 |
| Africa | 3 |
| North America | 12 |
| Latin America | 1 |

### Why the additions are concentrated in Asia-Pacific

Asia-Pacific is the largest block because the existing catalog was already strong in US/UK/European wires and weak in Asian national depth. The additions add Bangladesh, India, Pakistan, Myanmar coverage, Japan, South Korea, Singapore, Thailand, Vietnam, the Philippines and Taiwan. That breadth is deliberate: one “Asia” feed cannot substitute for national publishers with different relationships to their governments.

## Selection rules

### Included

- English-language or English-edition publishers with a clear editorial identity.
- A working RSS or a documented reason why no feed exists.
- A publisher that adds a country, a governance perspective, a conflict lens, or specialist coverage.
- Commercial, public-service, cooperative, non-profit and state media where the ownership model is disclosed.
- Sources whose biases can be described and monitored, not only sources that are expected to agree with a preferred framing.

### Excluded or deferred

- **bdnews24** — no valid RSS in the validation run.
- **The New Arab** — returned HTML rather than a feed.
- **The National** — no discoverable working feed.
- **Haaretz** — subscriber-only RSS route; public endpoint 404.
- **Caixin Global** — feed gateway returned 406.
- **NHK World** — only a feature/podcast feed was found; it was stale and not general news.
- **Kathmandu Post** — feed parsed but had no publication dates.
- **Folha de S.Paulo English** — no working English RSS.
- **Mail & Guardian** — RSS works, but Daily Maverick was selected for South African depth to avoid duplicating the same national market in this cycle.
- **Daily Sabah / Anadolu** — RSS works, but Hürriyet Daily News already provides Turkish national coverage and is the more established English-language reference; adding a second government-aligned Turkish source would require a separate balance rationale.
- **BenarNews, Jakarta Post, Rest of World, Americas Quarterly** — endpoints were blocked or unavailable during validation.
- **Reuters and AP** remain in the catalog without feeds because their absence would misrepresent the wire layer. They need a licensed/API path, not a fabricated RSS URL.

## Balance and known skew

The measured profile is centre-left: 36 Centre, 15 Centre-Left, 6 Centre-Right, 1 Left, 2 State-Aligned. Only three system mappings are `Right-leaning`. This is not a defensible “neutral” portfolio. The next research cycle should deliberately test centre-right and right-leaning publishers with valid feeds, especially in the US, UK, Australia and India, without lowering evidence standards.

The catalog is also English-only. That is a deliberate operational constraint, not a claim that English-language coverage is sufficient for global monitoring.

## State-media handling

Eight profiles map to `State Media` in the current system: ABC News Australia, Al Jazeera, CBC News, CNA, Deutsche Welle, Focus Taiwan, France 24 and TASS. Their ownership and editorial conditions differ sharply. TASS is the clear propaganda-risk case; public broadcasters with statutory independence are not equivalent. The catalog records the distinction in `ownershipNotes` and `editorialOrientation`, but the current enum collapses them.

## Activation philosophy

Profiles are research artifacts, not activation orders. A publisher can be valuable to the portfolio and still be unsafe to ingest: WSJ’s feed is stale, Arab News is blocked, Nikkei lacks dates, and Reuters/AP have no feed. The registry keeps those distinctions visible.

## Review triggers

- A feed’s newest item is older than seven days for a daily publisher.
- Ownership, funding or legal status changes.
- A publisher’s feed starts returning malformed XML or bot-protection pages.
- A major editorial purge, war-time censorship change, or regulatory action.
- The next scheduled review on 2026-11-08, or earlier if an activation decision depends on an open uncertainty.
