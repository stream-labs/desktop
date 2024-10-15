import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../app/services/api/trpc-api/type.ts'; // Import the API type definition

// Create a tRPC client
export const trpc = createTRPCProxyClient<AppRouter>({
                                                  links: [
                                                    httpBatchLink({
                                                                    url: 'http://localhost:4000',
                                                                  }),
                                                  ],
                                                });

