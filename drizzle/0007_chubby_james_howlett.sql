DO $$ BEGIN
 CREATE TYPE "public"."warning_source" AS ENUM('meteoalarm', 'ingv', 'gdacs');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "official_warnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "warning_source" NOT NULL,
	"external_id" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text,
	"title" text NOT NULL,
	"area" text NOT NULL,
	"regions" text[] DEFAULT '{}'::text[] NOT NULL,
	"magnitude" double precision,
	"depth_km" double precision,
	"lat" double precision,
	"lng" double precision,
	"onset_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"url" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notified_at" timestamp with time zone,
	CONSTRAINT "official_warnings_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warning_checks" (
	"source" "warning_source" PRIMARY KEY NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ok" boolean NOT NULL,
	"error" text
);
