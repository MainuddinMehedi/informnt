# E. Uncertainty and Follow-up Register

**Status:** DRAFT · **Date:** 2026-10-25 · All items are open unless explicitly closed.

Impact reflects the risk to catalog quality or activation. Confidence is confidence in the current assessment, not confidence that the issue is resolved.

| ID | Publisher / scope | Issue | Impact | Confidence | Follow-up | Owner | Due |
|---|---|---|---|---|---|---|---|
| U-01 | Reuters / AP | No verified official public RSS; Arc endpoints 404/403. | Critical | High | Licensed API or official partner feed | Source curation + ingestion | 2026-11-15 |
| U-02 | The Wall Street Journal | RSS is valid but stale since 2025-01-27. | High | High | Find a current Dow Jones feed or license content | Feed owner | 2026-11-08 |
| U-03 | The Daily Star | Frontpage feed stale since 2022; alternate stale and only 8 items. | High | High | Check section/AMP feeds and site migration | Feed owner | 2026-11-08 |
| U-04 | Arab News | [CLOSED 2026-10-25] Initial 403 was environment/header specific; verified HTTP 200 with 50 fresh items under production crawler headers. | Resolved | High | Maintain active monitoring | Ingestion engineering | Closed |
| U-05 | The Business Standard | RSS stale since 2021; /feed and /rss 404. | High | High | Confirm whether the publisher still maintains RSS | Feed owner | 2026-11-15 |
| U-06 | Nikkei Asia | [CLOSED 2026-10-25] Null XML date handling fixed via lightweight streaming HTML metadata extractor (extractArticleDate.js) in runIngest.js. | Resolved | High | Maintain active monitoring | Ingestion engineering | Closed |
| U-07 | Iran International | Reported Saudi-linked private financing; outlet denies state funding/ties. Ownership transparency limited. | High | Medium | Obtain corporate/beneficial ownership evidence; document both claims | Research | 2026-11-30 |
| U-08 | Al-Monitor | Exact ultimate owner/parent beyond Al-Monitor LLC not verified. | Medium | High | Check US corporate registrations and investor disclosures | Research | 2026-11-30 |
| U-09 | The Kyiv Independent | Legal entity and full governance not verified. | Medium | High | Confirm Ukrainian registration and board structure | Research | 2026-11-30 |
| U-10 | The Times of Israel | Founding/ownership documented, but funding and editorial independence need stronger evidence. | Medium | Medium | Israeli corporate registry and publisher disclosures | Research | 2026-11-30 |
| U-11 | +972 Magazine | Funder list may be incomplete; nonprofit filings not reviewed. | Medium | Medium | Obtain tax/nonprofit filings and current funder list | Research | 2026-11-30 |
| U-12 | Daily Maverick | Inkululeko >25% and no >50% holder reported; shareholder documents not reviewed. | Medium | Medium | Verify governance and nonprofit shareholder rights | Research | 2026-12-15 |
| U-13 | Bloomberg News | Privately held; editorial firewall from terminal/data business not independently verified. | Medium | Medium | Review editorial standards and ownership disclosures | Research | 2026-12-15 |
| U-14 | Financial Times | Nikkei ownership and editorial-independence trust arrangements need primary-source confirmation. | Low | Medium | Review trust deed and Nikkei disclosures | Research | 2026-12-15 |
| U-15 | The Economist | Complex dual-class/historic shareholder structure; current holdings not re-verified. | Low | Medium | Review annual report and trust arrangements | Research | 2026-12-15 |
| U-16 | Rappler | Philippine depositary receipt structure and current legal status need verification. | High | Medium | SEC filings and current ownership disclosures | Research + legal | 2026-11-30 |
| U-17 | Gulf News | Al Nisr ownership and state-linked commercial ties not fully transparent. | Medium | Medium | UAE corporate/registry review | Research | 2026-12-15 |
| U-18 | Hürriyet Daily News | Demirören 81.21% confirmed; government ties and editorial pressure need documentation. | Medium | Medium | Review Demirören disclosures and press-freedom reporting | Research | 2026-11-30 |
| U-19 | Middle East Eye | Funding has been contested; outlet denies state funding. | Medium | Medium | Obtain UK corporate filings and funder evidence | Research | 2026-11-30 |
| U-20 | AllAfrica | Aggregator model; originality and source attribution vary by item. | Medium | High | Sample source-level attribution and syndication rules | Research | 2026-12-15 |
| U-21 | El País English | Curated translation of Spanish newsroom; English feed is not the full El País report. | Medium | High | Document translation/curation scope in the UI | Product + research | 2026-11-30 |
| U-22 | The Irrawaddy | RSS parsed with a warning; malformed XML risk. | Medium | High | Monitor parser warnings and fallback behaviour | Ingestion engineering | 2026-11-15 |
| U-23 | All MBFC-rated profiles | MBFC is third-party, US-centric and may be stale; 29 profiles have no label. | Medium | High | Record retrieval date; do not treat absence as neutrality | Research | 2026-11-30 |
| U-24 | All profiles | No 20–30 article content analysis; classifications rely on feed-level samples and secondary sources. | High | High | Run a stratified article sample and a second coder | Research | 2026-12-15 |
| U-25 | All profiles | No peer review; every profile is DRAFT. | High | High | Assign an independent reviewer and sign-off log | Editorial | 2026-11-30 |
| U-26 | All profiles | No legal/ethical review of state-media ingestion or redistribution. | Medium | High | Legal review for TASS and other state media | Legal | 2026-12-15 |
| U-27 | Taxonomy | Template values do not map losslessly to `FeedSource` enums; `International` and `South America` are inconsistent with UI/SOP. | Medium | High | Decide canonical vocabulary and migration path | Product + data | 2026-11-30 |
| U-28 | Feed registry | Single snapshot on 2026-10-25; no continuous monitoring. | Medium | High | Automate freshness and HTTP health checks | Ingestion engineering | 2026-11-15 |
| U-29 | State-media labels | `State Media` collapses public broadcasters and propaganda outlets into one group. | Medium | High | Add ownership/independence sub-type | Product + data | 2026-12-15 |
| U-30 | CNA / Focus Taiwan | Wiki identity mapping was corrected: CNA is Mediacorp; Focus Taiwan is Taiwan's Central News Agency. Keep manual override in generator. | Low | High | Add regression check for wiki/manual mapping | Data engineering | 2026-11-15 |
| U-31 | CNA / The Straits Times / UN News / ABC Australia / CBC | State ownership, state funding and statutory independence are distinct; current enum and `stateFunded` flag flatten them. | Medium | Medium | Document funding, ownership and statutory independence separately | Research + product | 2026-12-15 |
| U-32 | Reuters / AP profiles | Profiles exist without feeds; portfolio counts can overstate operational coverage. | Medium | High | Exclude no-feed publishers from active-coverage metrics | Product | 2026-11-15 |

## How to close an item

1. Attach the primary document or test output to `evidence-register.json`.
2. Update the relevant profile’s `research.evidenceIds` and `researchNotes`.
3. Record the reviewer and date; do not close an ownership item on a single secondary source.
4. Re-run feed validation before changing any activation recommendation.
5. Keep the item open if the evidence is still contested, even after a profile is updated.
