-- Per-member room mute. Null means the room notifies that member, so every existing
-- membership stays unmuted and no row is rewritten.
ALTER TABLE "chat_members" ADD COLUMN "muted_at" timestamp with time zone;