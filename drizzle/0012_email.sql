CREATE TABLE "password_resets" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" text NOT NULL,
  "used_at" text,
  "created_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "password_resets_user" ON "password_resets" ("user_id");--> statement-breakpoint
CREATE TABLE "email_log" (
  "id" text PRIMARY KEY NOT NULL,
  "to_email" text NOT NULL,
  "template" text NOT NULL,
  "status" text NOT NULL,
  "error" text DEFAULT '' NOT NULL,
  "created_at" text NOT NULL
);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "receipt_sent_at" text;
