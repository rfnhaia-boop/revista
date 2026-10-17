CREATE TABLE "terms_acceptances" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "version" text NOT NULL,
  "source" text NOT NULL,
  "accepted_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "terms_acceptances_owner" ON "terms_acceptances" ("owner_id","version");
