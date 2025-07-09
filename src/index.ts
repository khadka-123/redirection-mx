import Fastify from "fastify";
import { handleRedirect } from "./handler";

const app = Fastify({ logger: true });

app.get("*", async (request, reply) => {
  try {
    await handleRedirect(request, reply);
  } catch (err) {
    request.log.error({ err }, "Error handling request:");
    reply.code(500).send("Internal Server Error");
  }
});

// Start the server
const start = async () => {
  try {
    const address = await app.listen({ port: 3000 });
    app.log.info(`Server listening at ${address}`);
  } catch (err) {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  }
};

start();

// Graceful shutdown on SIGINT/SIGTERM
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, closing server...`);
  try {
    //dont accept new request
    await app.close();           
    app.log.info("Server closed, exiting process");
    process.exit(0);
  } catch (err) {
    app.log.error(err, "Error during server close");
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
