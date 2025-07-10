import type { FastifyRequest, FastifyReply } from "fastify";
import { getLatestRedirectRules } from "./utils/readXlsx";


/**
 * Handle domain redirects based on Excel config.
 */
export async function handleRedirect(request: FastifyRequest, reply: FastifyReply) {
  request.log.debug("Loading redirect rules from Excel");
  const rules = await getLatestRedirectRules(request.log);

  if (!rules) {
    request.log.error("No Excel file found or failed to read rules.");
    return reply.code(500).send("Redirect rules not available");
  }

  const requestUrl = request.raw.url || "";
  request.log.trace({ requestUrl }, "Raw request URL");

  const match = rules.find(rule => {
    try {
      const rulePath = new URL(rule.sourceUrl).pathname;
      const reqPath  = new URL(`http://localhost${requestUrl}`).pathname;
      request.log.debug({ rulePath, reqPath }, "Comparing paths");
      return reqPath === rulePath;
    } catch (err) {
      request.log.warn({ err, rule }, "Skipping invalid rule URL");
      return false;
    }
  });

  if (match) {
    const statusCode = 301;
    request.log.info({ match, statusCode }, "Rule matched -redirecting");
    return reply.code(statusCode).redirect(match.destinationUrl);
  } else {
    request.log.info({ path: requestUrl }, "No matching rule -returning 404");
    return reply.code(404).send("404 Not Found");
  }
}
