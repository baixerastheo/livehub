-- CreateTable
CREATE TABLE "ReactionMessage" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReactionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReactionMessagePrive" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReactionMessagePrive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReactionMessage_messageId_idx" ON "ReactionMessage"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ReactionMessage_messageId_userId_emoji_key" ON "ReactionMessage"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "ReactionMessagePrive_messageId_idx" ON "ReactionMessagePrive"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ReactionMessagePrive_messageId_userId_emoji_key" ON "ReactionMessagePrive"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "ReactionMessage" ADD CONSTRAINT "ReactionMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionMessage" ADD CONSTRAINT "ReactionMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionMessagePrive" ADD CONSTRAINT "ReactionMessagePrive_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MessagePrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionMessagePrive" ADD CONSTRAINT "ReactionMessagePrive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
