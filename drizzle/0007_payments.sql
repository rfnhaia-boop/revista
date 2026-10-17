CREATE TABLE "payout_accounts" (
  "owner_id" text PRIMARY KEY NOT NULL,
  "provider" text DEFAULT 'asaas' NOT NULL,
  "provider_account_id" text DEFAULT '' NOT NULL,
  "wallet_id" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "plans" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "name" text NOT NULL,
  "price_cents" integer NOT NULL,
  "interval" text DEFAULT 'monthly' NOT NULL,
  "active" integer DEFAULT 1 NOT NULL,
  "created_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "plans_owner" ON "plans" ("owner_id");--> statement-breakpoint
CREATE TABLE "subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "reader_owner_id" text NOT NULL,
  "creator_owner_id" text NOT NULL,
  "plan_id" text NOT NULL,
  "provider_subscription_id" text UNIQUE,
  "status" text DEFAULT 'pending' NOT NULL,
  "current_period_end" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "subscriptions_reader" ON "subscriptions" ("reader_owner_id");--> statement-breakpoint
CREATE INDEX "subscriptions_creator" ON "subscriptions" ("creator_owner_id");--> statement-breakpoint
CREATE TABLE "payments" (
  "id" text PRIMARY KEY NOT NULL,
  "provider_payment_id" text UNIQUE NOT NULL,
  "payer_owner_id" text NOT NULL,
  "creator_owner_id" text NOT NULL,
  "kind" text NOT NULL,
  "notebook_id" text,
  "subscription_id" text,
  "amount_cents" integer NOT NULL,
  "commission_cents" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint
CREATE INDEX "payments_payer" ON "payments" ("payer_owner_id");--> statement-breakpoint
CREATE TABLE "entitlements" (
  "id" text PRIMARY KEY NOT NULL,
  "reader_owner_id" text NOT NULL,
  "creator_owner_id" text NOT NULL,
  "kind" text NOT NULL,
  "notebook_id" text,
  "payment_id" text NOT NULL,
  "starts_at" text NOT NULL,
  "ends_at" text,
  "status" text DEFAULT 'active' NOT NULL
);--> statement-breakpoint
CREATE INDEX "entitlements_reader" ON "entitlements" ("reader_owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_payment_unique" ON "entitlements" ("payment_id");--> statement-breakpoint
CREATE TABLE "webhook_events" (
  "event_id" text PRIMARY KEY NOT NULL,
  "provider" text NOT NULL,
  "event" text NOT NULL,
  "payload" text NOT NULL,
  "received_at" text NOT NULL,
  "processed_at" text
);
