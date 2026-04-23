-- CreateEnum
CREATE TYPE "StatutDemandeAmitie" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "DemandeAmitie" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "statut" "StatutDemandeAmitie" NOT NULL DEFAULT 'EN_ATTENTE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeAmitie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandeAmitie_fromUserId_idx" ON "DemandeAmitie"("fromUserId");

-- CreateIndex
CREATE INDEX "DemandeAmitie_toUserId_idx" ON "DemandeAmitie"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandeAmitie_fromUserId_toUserId_key" ON "DemandeAmitie"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "DemandeAmitie" ADD CONSTRAINT "DemandeAmitie_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeAmitie" ADD CONSTRAINT "DemandeAmitie_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
