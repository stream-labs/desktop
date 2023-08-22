import { Service } from 'services/core';
// // @ts-ignore
// import { initTRPC } from '@trpc/server';
// // @ts-ignore
// import { createOpenApiHttpHandler, generateOpenApiDocument, OpenApiMeta } from 'trpc-openapi';
// import { z } from 'zod';
// import http from 'http';
//
// const PORT = 3222;
// const t = initTRPC.meta<OpenApiMeta>().create(); /* 👈 */
//
// export const appRouter = t.router({
//   sayHello: t.procedure
//     .meta({ /* 👉 */ openapi: { method: 'GET', path: '/say-hello' } })
//     .input(z.object({ name: z.string() }))
//     .output(z.object({ greeting: z.string() }))
//     .query(({ input }) => {
//       return { greeting: `Hello ${input.name}!` };
//     }),
// });
//
// export const openApiDocument = generateOpenApiDocument(appRouter, {
//   title: 'tRPC OpenAPI',
//   version: '1.0.0',
//   baseUrl: `http://localhost:${PORT}`,
// });

export class ExternalApiV2Service extends Service {
  // init() {
  //   const server = http.createServer(createOpenApiHttpHandler({ router: appRouter })); /* 👈 */
  //
  //   server.listen(PORT);
  // }
}
