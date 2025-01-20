import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

async function globalSetup(config: FullConfig) {
  // Load test environment variables from .env.test
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

  // Verify required environment variables are set
  const requiredEnvVars = [
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
    'TEST_AUTH_TOKEN',
    'VITE_MONGODB_URI',
    'PG_HOST',
    'PG_PORT',
    'PG_DATABASE',
    'PG_USER',
    'PG_PASSWORD'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Create a .env.test file with these variables for E2E testing.'
    );
  }

  // Create example .env.test if it doesn't exist
  const envTestPath = path.resolve(process.cwd(), '.env.test.example');
  const envTestContent = `
# Auth0 Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your_test_password
TEST_AUTH_TOKEN=your_test_token

# Database Connections
VITE_MONGODB_URI=mongodb://localhost:27017/test_db
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=test_db
PG_USER=test_user
PG_PASSWORD=test_password
`;

  try {
    await fs.promises.access(envTestPath);
  } catch {
    await fs.promises.writeFile(envTestPath, envTestContent);
    console.log('Created .env.test.example file. Copy to .env.test and update with your test credentials.');
  }
}

export default globalSetup;
