import type { FastifyRequest, FastifyReply } from "fastify";
import { getLatestRedirectRules } from "./utils/readXlsx";

/**
 * 
 * @param request Fastify Request
 * @param reply Fastify Reply
 * @returns retrieves the url if it exists in xlsx file and redirect to new domain
 */
export async function handleRedirect(request: FastifyRequest, reply: FastifyReply) {
  request.log.debug("Loading redirect rules from Excel");
  const rules = await getLatestRedirectRules(request.log);
  if (!rules) {
    request.log.error("No Excel file found or failed to read rules.");
    reply.code(500).send("Redirect rules not available");
    return;
  }
  //gives only path and query after host /path?query
  const requestUrl = request.raw.url || "";
  request.log.trace({requestUrl},"Raw request URL");

  //if match is found it return rule object else undefined
  const match = rules.find((rule) => {
    try {
      //URl class breaks url into parts 
      //protocol:https hostname:localhost port:3000 pathname:/blog search:?query
      const rulePath = new URL(rule.sourceUrl).pathname;
      const reqPath = new URL(`http://localhost${requestUrl}`).pathname;
      request.log.debug({rulePath,reqPath},"Comparing paths");
      return reqPath === rulePath;
    } catch(err) {
      request.log.warn({err,rule},"Skipping invalid rule URL");
      return false;
    }
  });

  if (match) {
    const statusCode = 301;
    request.log.info({match,statusCode},"Rule matched -redirecting");
    reply.code(statusCode).redirect(match.destinationUrl);
  } else {
    request.log.info({path:requestUrl},"No matching rule -returning 404");
    reply.code(404).send("404 Not Found");
  }
}
