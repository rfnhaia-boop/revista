CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"area" text NOT NULL,
	"kind" text NOT NULL,
	"author_name" text NOT NULL,
	"reading_minutes" integer DEFAULT 5 NOT NULL,
	"kicker" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"pullquote" text DEFAULT '' NOT NULL,
	"references_text" text DEFAULT '' NOT NULL,
	"status_note" text DEFAULT 'Não revisado por pares.' NOT NULL,
	"version_note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "articles_status_pub" ON "articles" USING btree ("status","published_at");