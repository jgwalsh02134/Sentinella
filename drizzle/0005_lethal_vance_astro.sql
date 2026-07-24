ALTER TABLE "check_ins" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_client_id_unique" UNIQUE("client_id");