/**
 * Vitest setup file for configuring test environment
 */

import { beforeAll } from 'vitest';
import { config } from 'dotenv';

beforeAll(() => {
  // Load test environment variables from .env.test
  config({ path: '.env.test' });
});