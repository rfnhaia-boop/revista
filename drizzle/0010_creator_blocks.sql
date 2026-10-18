CREATE TABLE "creator_blocks" (
  "owner_id" text PRIMARY KEY NOT NULL,
  "reason" text DEFAULT '' NOT NULL,
  "blocked_by" text NOT NULL,
  "blocked_at" text NOT NULL
);
