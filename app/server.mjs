import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb } from './src/db.mjs';
import { createApp } from './src/app.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const dataDir = process.env.DATA_DIR ?? join(here, 'data');

const db = openDb(join(dataDir, 'urinal.db'));
createApp(db, { publicDir: join(here, 'public') }).listen(port, '0.0.0.0', () => console.log(`urinal-test listening on :${port} (data: ${dataDir})`));
