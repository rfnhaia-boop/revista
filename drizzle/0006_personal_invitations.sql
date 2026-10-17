ALTER TABLE "creator_invitations" ADD COLUMN "invited_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_invitations" ADD COLUMN "message" text DEFAULT '' NOT NULL;
