DO $$ BEGIN
 CREATE TYPE "public"."advisory_source" AS ENUM('state_advisory', 'state_rss', 'embassy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_advisories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "advisory_source" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text NOT NULL,
	"level" integer,
	"regions" text[] DEFAULT '{}'::text[] NOT NULL,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_advisories_url_unique" UNIQUE("url")
);
