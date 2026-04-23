import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const candidateEnvPaths = [
  // When running from `backend/` or when compiled to `backend/dist/`
  path.resolve(__dirname, '..', '.env'),
  // When running from repo root
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];

const envPath = candidateEnvPaths.find((p) => fs.existsSync(p));

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}
