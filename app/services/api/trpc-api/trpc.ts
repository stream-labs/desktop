import { createHTTPServer } from '@trpc/server/adapters/standalone';
// import { initTRPC } from '@trpc/server';
import * as trpc from '@trpc/server';
import { z } from 'zod';
import * as trpcExpress from '@trpc/server/adapters/express';
import express from 'express';

// const appRouter = trpc.router().query('getUser', {
//   input: z.string(),
//   async resolve(req) {
//     req.input; // string
//     return { id: req.input, name: 'Bilbo' };
//   },
// });

// Initialize tRPC
// const t = initTRPC.create();
//
// // Create the tRPC router
// export const appRouter = t.router({
//   // Define a procedure named 'hello'
//   hello: t.procedure
//     .input(
//       z
//         .object({
//           name: z.string().optional(),
//         })
//         .optional(),
//     )
//     .query(({ input }) => {
//       return {
//         greeting: `Hello ${input?.name ?? 'world'}`,
//       };
//     }),
// });
//
// export type AppRouter = typeof appRouter;

export function listenTrpc() {
  // // Create the HTTP server using the standalone adapter
  // const server = createHTTPServer({
  //   router: appRouter,
  //   createContext: () => ({}),
  // });
  //
  // // Start the server
  // server.listen(4000);
  // console.log('Server listening on port 4000');


  // const PORT = 4000;
  // const app = express();
  // app.use(
  //   '/trpc',
  //   trpcExpress.createExpressMiddleware({
  //     router: appRouter,
  //     createContext: () => ({}), // Define your context here if needed
  //   }),
  // );
  //
  // // Start the server
  // app.listen(PORT, () => {
  //   console.log(`🚀 Server is running on http://localhost:${PORT}`);
  // });
}
