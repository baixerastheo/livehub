-- CreateEnum
CREATE TYPE "TypeCanal" AS ENUM ('TEXTE', 'VOCAL');

-- AlterTable
ALTER TABLE "Canal" ADD COLUMN     "type" "TypeCanal" NOT NULL DEFAULT 'TEXTE';
