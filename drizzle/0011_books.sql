CREATE TABLE "books" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "title" text NOT NULL,
  "author" text NOT NULL,
  "year" integer,
  "description" text DEFAULT '' NOT NULL,
  "license" text NOT NULL,
  "license_note" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_by" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "book_chapters" (
  "id" text PRIMARY KEY NOT NULL,
  "book_id" text NOT NULL,
  "position" integer NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "book_chapters_pos" ON "book_chapters" ("book_id","position");--> statement-breakpoint
CREATE TABLE "book_notes" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "book_id" text NOT NULL,
  "chapter" integer NOT NULL,
  "paragraph" integer NOT NULL,
  "quote" text NOT NULL,
  "body" text NOT NULL,
  "tag" text DEFAULT '' NOT NULL,
  "created_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "book_notes_owner_book" ON "book_notes" ("owner_id","book_id");--> statement-breakpoint
CREATE TABLE "book_marks" (
  "owner_id" text NOT NULL,
  "book_id" text NOT NULL,
  "chapter" integer NOT NULL,
  "paragraph" integer NOT NULL,
  "created_at" text NOT NULL,
  PRIMARY KEY ("owner_id","book_id","chapter","paragraph")
);--> statement-breakpoint
CREATE TABLE "book_progress" (
  "owner_id" text NOT NULL,
  "book_id" text NOT NULL,
  "chapter" integer NOT NULL,
  "paragraph" integer NOT NULL,
  "updated_at" text NOT NULL,
  PRIMARY KEY ("owner_id","book_id")
);
