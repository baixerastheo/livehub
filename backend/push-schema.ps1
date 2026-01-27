# Script pour pousser le schéma Prisma vers Supabase local
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
$env:DIRECT_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

Write-Host "Pushing Prisma schema to Supabase local..."
npx prisma db push

