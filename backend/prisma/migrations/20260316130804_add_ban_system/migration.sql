-- CreateTable
CREATE TABLE "BanServeur" (
    "id" SERIAL NOT NULL,
    "serveurId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "bannePar" TEXT NOT NULL,
    "raison" TEXT,
    "expireLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BanServeur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BanServeur_serveurId_idx" ON "BanServeur"("serveurId");

-- CreateIndex
CREATE INDEX "BanServeur_userId_idx" ON "BanServeur"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BanServeur_userId_serveurId_key" ON "BanServeur"("userId", "serveurId");

-- AddForeignKey
ALTER TABLE "BanServeur" ADD CONSTRAINT "BanServeur_serveurId_fkey" FOREIGN KEY ("serveurId") REFERENCES "Serveur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanServeur" ADD CONSTRAINT "BanServeur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanServeur" ADD CONSTRAINT "BanServeur_bannePar_fkey" FOREIGN KEY ("bannePar") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
