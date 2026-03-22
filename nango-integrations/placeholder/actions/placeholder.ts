/**
 * Placeholder action for initial setup
 * This will be removed once actual provider integrations are added
 */

import { createAction } from 'nango';
import { z } from 'zod';

export default createAction({
  description: 'Placeholder action for initial setup',
  version: '1.0.0',
  input: z.void(),
  output: z.object({
    message: z.string(),
  }),
  exec: async (nango) => {
    await nango.log('Placeholder action - will be replaced with actual provider integrations');
    return { message: 'Placeholder action' };
  },
});
