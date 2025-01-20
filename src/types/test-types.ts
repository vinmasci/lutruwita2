import { Express } from 'express';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_MONGODB_URI: string;
      PG_HOST: string;
      PG_PORT: string;
      PG_DATABASE: string;
      PG_USER: string;
      PG_PASSWORD: string;
      TEST_AUTH_TOKEN: string;
    }
  }

  // For test environment
  var app: Express;
}

export interface TestContext {
  mongoClient: MongoClient;
  pgPool: Pool;
}
