# Informnt Publisher & Feed Catalog — 60 Publisher Profiles

> **Status: DRAFT / PARTIALLY ACTIVATED — 2026-10-26.** All 60 profiles remain research dossiers. Candidate Batch 1 (10 feeds across 9 publishers: Financial Times, The Economist, Bloomberg Markets & Politics, The Times of Israel, The Kyiv Independent, Meduza, Daily Maverick, Premium Times, and El País English) was activated into production `FeedSource` and verified via live ingestion on 2026-10-26. All other candidate profiles remain in review.

This directory is the research output for the Informnt publisher/feed catalog. It contains exactly 60 canonical-template publisher profiles, a feed-validation registry, an evidence register, and the A–G analysis deliverables.

## Portfolio at a glance

| Metric | Result |
|---|---:|
| Publisher profiles | **60** |
| Existing feeds reviewed | 27 |
| New publishers assessed | 33 |
| Primary feed rows | 59 |
| Registry rows including tested alternatives | 77 |
| Evidence entries | 215 |
| Profiles rated by MBFC | 31 |
| Profiles with no MBFC bias label | 29 |
| Profiles with no public feed | 2 (Reuters, AP) |
| Profile status | 60 DRAFT |

### Primary feed validation

| Status | Primary rows | Interpretation |
|---|---|---|
| Validated | 54 | Safe to retain or consider |
| Validated with warning | 1 | Activate with monitoring |
| Validated, no dates | 1 | Keep only with date caveat |
| Stale | 3 | Do not activate / repair |
| Access restricted | 0 | Do not activate |
| **Feed-bearing primary rows** | **59** | Rows across 58 publishers |

No-feed publishers: **Reuters** and **AP**. They have publisher profiles but no primary feed row.


### Regional spread

| Region | Profiles | Countries/territories |
|---|---|---|
| Global / multi-region | 1 | 1 |
| Asia-Pacific | 23 | 13 |
| Europe | 13 | 7 |
| Middle East | 7 | 6 |
| Africa | 3 | 3 |
| North America | 12 | 2 |
| Latin America | 1 | 1 |

## Key findings

1. **24 of the 27 existing feeds are currently valid.** WSJ is stale since 2025-01-27; The Daily Star is stale; Arab News is verified active with 50 current items under production crawler headers; Nikkei Asia has no publication dates and would receive ingest-time timestamps.
2. **Reuters and AP have no verified official public RSS.** They remain in the publisher catalog because they are essential wires, but they cannot be activated through the current RSS pipeline without a licensed/API route.
3. **The new-source layer is viable but uneven.** The 32 new feed rows break down as 27 routine activation candidates, one state-media comparison (TASS), two monitoring cases (Iran International, VnExpress), one XML-warning feed (Irrawaddy), and one stale feed (Business Standard). Two further publishers, Reuters and AP, have no feed. Every activated feed still needs monitoring during its first month.
4. **The catalog is structurally centre-left.** Assessed leaning is 36 Centre, 15 Centre-Left, 6 Centre-Right, 1 Left and 2 State-Aligned. There is no explicitly right-wing publisher. This is a portfolio skew to correct, not a neutral outcome.
5. **Africa and Latin America are underweight.** Africa has 3 publishers and Latin America has 1 Argentine publisher (Buenos Aires Times). El País English adds Spanish and Latin American coverage but is Spain-based. Asia-Pacific has 23 profiles, but country depth is uneven and mainland China is absent.
6. **The production taxonomy cannot represent this catalog cleanly.** Public-service, cooperative, non-profit and wire-service distinctions, plus `sourceRegion` and `sourceType` nuances, do not map losslessly into the current `FeedSource` enums. Existing values were preserved; the mismatch is documented rather than hidden.
7. **The template and the current UI disagree.** The template allows `International` coverage and `South America`; the UI canonical vocabulary uses `Global` and the SOP says `Latin America`. The catalog records the research value and flags the mapping issue.

## Files

| File | Purpose |
|---|---|
| `README.md` | This index, scope, counts and caveats |
| `portfolio-strategy.md` | A: portfolio construction, inclusion/exclusion logic and gaps |
| `evidence-register.json` | B: 215 source and feed evidence entries |
| `coverage-and-redundancy-report.md` | C: regional, ownership, type and overlap analysis |
| `feed-validation-registry.json` | D: 77 machine-readable feed rows |
| `uncertainty-and-follow-up-register.md` | E: open questions, impact and verification owners |
| `activation-recommendations.md` | F: existing and candidate feed actions |
| `recommended-improvements.md` | G: prioritized platform improvements |
| `publisher-catalog.md` | One-row-per-publisher index across all 60 |

## How to read a profile

Each `<slug>.json` follows the canonical template. The `research` block adds `evidenceIds` so every factual claim can be traced into `evidence-register.json`. Feed entries carry a validation snapshot, but that snapshot is a single retrieval on 2026-10-25; it is not a guarantee of current availability.

## Evidence and limitations

- **Source evidence:** official pages where accessible, Wikipedia for corroboration, MBFC where a rating existed, and live RSS retrieval.
- **Not done:** full article sampling, coding of 20–30 articles per publisher, a second reviewer, legal review, or continuous feed monitoring.
- **Blocked sources:** several official about pages returned 403/404/406. These are recorded as limitations, not silently replaced.
- **Ownership:** contested or opaque cases remain explicitly uncertain. See the uncertainty register.
- **Ratings:** MBFC is a third-party, US-centric rating and was unavailable for 29 profiles.
- **Feed dates:** two feeds in the research set lacked dates; only Nikkei is in this 60-profile catalog. The ingestion fallback to `new Date()` makes that a material risk.

## Recommended next action

Read `activation-recommendations.md` first. The immediate operational actions are to pause WSJ and The Daily Star, handle Nikkei’s missing dates, and run a controlled first batch of the strongest new candidates — not to activate the full new-source set at once.
