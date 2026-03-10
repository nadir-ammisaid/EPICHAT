-- Add typed message support for media/GIF payloads
ALTER TABLE "messages"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN "mediaUrl" TEXT;
