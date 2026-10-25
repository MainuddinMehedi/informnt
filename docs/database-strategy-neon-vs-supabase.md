# Database Strategy & Infrastructure: Neon vs. Supabase

## 1. Overview & Architectural Context

The Global News Aggregator architecture decouples database operations from cloud-specific vendor SDKs. The application interacts with PostgreSQL exclusively through:
* **Prisma ORM** with `@prisma/adapter-pg` (Node-Postgres connection pool).
* **`pg-boss`** (PostgreSQL-native distributed background queue).
* **NextAuth** via `@auth/prisma-adapter`.

Because there is zero vendor SDK lock-in (no `@supabase/supabase-js`, no vendor-specific auth, storage, or RLS policies in the application code), the database provider is determined entirely by environment variables:
- `DATABASE_URL`: Runtime pooled connection string (used by Prisma and `pg-boss`).
- `DIRECT_URL`: Direct PostgreSQL connection string (used by `prisma.config.ts` for schema migrations).

This enables seamless switching, dual-provider configurations, or isolated sandboxes without touching application code.

---

## 2. Grounded Specification Matrix (Free Tiers)

Grounded directly against official provider tier specifications:

| Feature / Metric | **Supabase (Free Plan)** | **Neon (Free Plan - Lakebase)** | Operational Impact on System |
| :--- | :--- | :--- | :--- |
| **Database Storage** | **500 MB (0.5 GB)** | **1 GB per project** | Neon provides **2x storage**. 30k articles take ~152 MB; 1 GB supports ~150k+ articles with embeddings. |
| **Compute / RAM** | **Shared CPU • 500 MB RAM** | **Sizes up to 2 CU (8 GB RAM)** | **16x more RAM on Neon**. Critical for `pgvector` HNSW graph builds and cosine similarity queries. |
| **Active Projects** | **Max 2 active projects** (account-wide) | **100 projects** | Neon allows spinning up separate project sandboxes (demo, testing, archive, staging) freely. |
| **Inactivity / Sleep** | **Hard pause after 7 days**. Requires manual unpause in dashboard; takes minutes to restore. | **Autosuspend after 5 min**. Wakes up **automatically in 1–2s** on next query. | Neon provides zero-touch recovery; Supabase requires manual operator intervention if inactive. |
| **Compute Allowance** | Bound by 7-day inactivity pause. | **100 CU-hrs monthly per project** | At base 0.25 CU autoscaling, provides up to **~400 wall-clock hours** of active compute monthly per project. |
| **Quota Enforcement** | **"Grace period is over"**: Hard cutoff; writes immediately restricted upon reaching quota. | Quota tracked per project; compute scales down to zero when idle. | High-volume ingestion or vector backfills will not silently break a production database. |
| **Connection Pooling** | PgBouncer on port 6543 (`?pgbouncer=true`). | Neon PgBouncer on host `-pooler` (port 5432, `?sslmode=require`). | Clean connection pooling for serverless / Next.js lambdas. |

---

## 3. Workload Compatibility & Technical Quirks

### 3.1. `pgvector` & HNSW Indexing
* **Extension Support:** Both providers run native PostgreSQL `vector` extension (`vector(768)`).
* **HNSW Indexing (`vector_cosine_ops`):** 
  * In Postgres, constructing high-dimensional HNSW graphs is memory-intensive (`maintenance_work_mem`).
  * On Supabase Free (500 MB RAM total), running large batch vector backfills (`backfillLockedTopicEmbeddings.js` or `enrichmentPipeline.js`) can trigger memory pressure or spill to disk.
  * On Neon, the compute autoscaler scales up to **2 CU (8 GB RAM)** during heavy query loads and indexing, providing high stability for semantic searches and clustering.
* **Codebase Migration Quirk:**
  * Prisma does not natively support `Unsupported("vector(768)")` HNSW index definitions without schema drift.
  * Migration `20260621223446` explicitly dropped `idx_processed_article_embedding`.
  * **Rule:** Whenever deploying migrations to a fresh database (`npx prisma migrate deploy`), you must execute:
    ```bash
    npm run db:restore-indexes
    ```
    This reapplies `prisma/add_embedding_index.sql` and `prisma/add_locked_topic_embedding_index.sql`.

### 3.2. `pg-boss` Polling vs. Neon Compute Auto-Suspend
* **The Interaction:** `pg-boss` background workers (`ingestion-service/masterWorker.js`) poll the database every 2 seconds (`SELECT ... FROM pgboss.job`).
* **The Pitfall:** Continuous 2-second polling keeps the database connection active indefinitely. As long as `masterWorker.js` is running, Neon will **never enter autosuspend**.
  * Continuous 24/7 polling at 0.25 CU: 720 hours × 0.25 CU = 180 CU-hours (exceeds the 100 CU-hr monthly quota).
* **Operational Rules:**
  1. **Do not run `npm run worker` as an unattended 24/7 local daemon on Neon Free tier.** Run it on-demand for development, testing, and demo recording. Terminate with `Ctrl+C` when finished.
  2. For fresh data ingestion without a persistent polling loop, trigger standalone scripts:
     ```bash
     npm run ingest        # Full RSS fetch + AI enrichment + embeddings
     npm run ingest:raw    # RSS fetch + dedup only (skips AI)
     npm run scan-topics   # Surveillance scan on locked topics
     npm run cluster       # Story clustering pass
     ```

### 3.3. Connection Pooler vs. Direct URL for Initial Bootstrapping
* Neon's connection pooler operates in **transaction pooling** mode.
* When `pg-boss` initializes for the very first time on a fresh database, it executes DDL statements (`CREATE SCHEMA IF NOT EXISTS pgboss;`, table definitions, version tracking).
* While runtime job enqueuing and polling work cleanly through the pooler, initial schema creation is safest using the Direct URL (`DIRECT_URL`) to avoid pooler transaction boundary errors.

---

## 4. Current Database State & Dual-Provider Workflow

* **Supabase Project (`MainuddinMehedi's Org`):**
  * Holds ~30k historical articles, ~152 MB / 500 MB storage (30% used).
  * Egress usage is < 1% (0.042 GB / 5 GB).
  * Safe for reading, querying, evaluating models, and offline analysis.
* **Neon Project (`global-news-aggregator` sandbox):**
  * Fresh 1 GB database.
  * Dedicated 100 CU-hrs/month.
  * Ideal for clean-slate demonstrations, LinkedIn video recordings, active ingestion experiments, and zero-risk schema modifications.

---

## 5. Provider Setup & Migration Playbook

### Step 1: Environment Configuration
Update both `[root .env](file:///.env)` and `[frontend/.env.local](file:///frontend/.env.local)`. Archive the Supabase strings as comments:

```ini
# --- SUPABASE (Historical Archive) ---
# DATABASE_URL="postgresql://postgres:[password]@db.[id].supabase.co:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres"

# --- NEON (Fresh Demo / Active Work) ---
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require"
```

### Step 2: Database Provisioning & Schema Deploy
From repository root:
```bash
# 1. Regenerate Prisma Client
npx prisma generate

# 2. Deploy schema migrations
npx prisma migrate deploy

# 3. Restore pgvector HNSW indexes
npm run db:restore-indexes

# 4. Seed Canonical Categories, FeedSources, and AI settings
npm run seed
```

### Step 3: Verification & Ingestion
```bash
# Verify pipeline with an AI-free ingest pass
npm run ingest:raw

# Run Next.js frontend
cd frontend && npm run dev
```
