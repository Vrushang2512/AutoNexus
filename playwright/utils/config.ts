import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const config = {
  baseUrl: process.env.ENVIZOM_BASE_URL || 'https://envizom.oizom.com',
  email: process.env.ENVIZOM_EMAIL || '',
  password: process.env.ENVIZOM_PASSWORD || '',
};

export function validateCredentials() {
  if (!config.email || !config.password) {
    throw new Error(
      'Missing test credentials. Copy .env.example to .env and fill in ENVIZOM_EMAIL and ENVIZOM_PASSWORD'
    );
  }
}
