import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Don't add NODE_ENV into T3 Env, it changes the tree-shaking behavior
export const Env = createEnv({
  /**
   * Client-side environment variables schema
   */
  client: {
    // No client-side env vars for now
  },
  /**
   * Server-side environment variables schema
   */
  server: {
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
  },
  /**
   * Specify your client-side environment variables schema here
   */
  clientPrefix: '',
  /**
   * Environment variables available on the client and server
   */
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
});
