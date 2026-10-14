ALTER TABLE "articles" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "review_note" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "submitted_at" text;--> statement-breakpoint
CREATE INDEX "articles_author" ON "articles" USING btree ("author_id");