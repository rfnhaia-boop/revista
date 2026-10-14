CREATE TABLE "notebook_views" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"viewer_key" text NOT NULL,
	"day" text NOT NULL,
	"created_at" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "notebook_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"seen_at" text,
	"created_at" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "notebook_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "notebook_views_post_day" ON "notebook_views" USING btree ("post_id","day");--> statement-breakpoint
CREATE INDEX "notebook_replies_post" ON "notebook_replies" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "notebook_reactions_post" ON "notebook_reactions" USING btree ("post_id");
