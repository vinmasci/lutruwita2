import { Express } from 'express';

declare module './server.js' {
  const app: Express;
  export { app };
}
