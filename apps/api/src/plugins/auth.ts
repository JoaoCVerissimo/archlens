import fp from "fastify-plugin";

export default fp(async (fastify, opts: { apiKey: string }) => {
  fastify.addHook("onRequest", async (request, reply) => {
    // Skip auth for health check
    if (request.url.startsWith("/health")) return;

    const key = request.headers["x-api-key"];
    if (key !== opts.apiKey) {
      reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" },
      });
    }
  });
});
