CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"context" text NOT NULL,
	"importance" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"expires_at" text NOT NULL,
	"accepted_by" text,
	"created_at" text NOT NULL,
	CONSTRAINT "creator_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"area" text NOT NULL,
	"problem" text NOT NULL,
	"justification" text NOT NULL,
	"expected_result" text NOT NULL,
	"stage" text NOT NULL,
	"goal_cents" integer NOT NULL,
	"budget" text NOT NULL,
	"timeline" text NOT NULL,
	"team" text NOT NULL,
	"risks" text NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "knowledge_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "member_accounts" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notebooks" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"format" text NOT NULL,
	"area" text NOT NULL,
	"access" text NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"bio" text NOT NULL,
	"trajectory" text DEFAULT '' NOT NULL,
	"interests" text NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"show_supporters" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "profiles_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"title" text NOT NULL,
	"funding_model" text NOT NULL,
	"minimum_cents" integer NOT NULL,
	"target_cents" integer NOT NULL,
	"maximum_cents" integer NOT NULL,
	"purpose" text NOT NULL,
	"deliverables" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"requested_role" text NOT NULL,
	"presentation" text NOT NULL,
	"experience" text NOT NULL,
	"portfolio" text DEFAULT '' NOT NULL,
	"motivation" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"area" text NOT NULL,
	"author" text NOT NULL,
	"summary" text NOT NULL,
	"methodology" text NOT NULL,
	"references_text" text NOT NULL,
	"budget_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "questions_owner" ON "community_questions" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "questions_status" ON "community_questions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "follows_profile" ON "follows" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "projects_status_date" ON "knowledge_projects" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "projects_owner" ON "knowledge_projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "notebooks_status_date" ON "notebooks" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "notebooks_owner" ON "notebooks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "rounds_project" ON "project_rounds" USING btree ("project_id","round_number");--> statement-breakpoint
CREATE INDEX "rounds_owner" ON "project_rounds" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "project_updates_project" ON "project_updates" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "role_requests_owner" ON "role_requests" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "role_requests_status" ON "role_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "submissions_owner_created" ON "submissions" USING btree ("owner_id","created_at");