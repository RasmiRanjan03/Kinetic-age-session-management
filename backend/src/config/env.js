import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve absolute path to backend/.env
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });
