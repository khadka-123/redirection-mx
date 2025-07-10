import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";
import { handleRedirect } from "../src/handler";
import * as reader from "../src/utils/readXlsx";

describe("handleRedirect", () => {
  let fakeRequest: Partial<FastifyRequest>;
  let fakeReply: Partial<FastifyReply>;
  let fakeLog: any;

  beforeEach(() => {
    fakeLog = {
      debug: vi.fn(),
      trace: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    fakeRequest = {
      raw: { url: "/one?x=1" },
      log: fakeLog,
    } as any;

    fakeReply = {
      code: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any;
  });

  it("redirects when a matching rule is found", async () => {
    vi.spyOn(reader, "getLatestRedirectRules").mockResolvedValue([
      {
        sourceUrl: "https://localhost:3000/one",
        destinationUrl: "https://target.com/new",
      },
    ]);

    await handleRedirect(fakeRequest as any, fakeReply as any);

    expect(fakeReply.code).toHaveBeenCalledWith(301); 
    expect(fakeReply.redirect).toHaveBeenCalledWith("https://target.com/new");
    expect(fakeLog.info).toHaveBeenCalledWith(
      expect.objectContaining({ match: expect.any(Object), statusCode: 301 }),
      "Rule matched -redirecting"
    );
  });

  it("returns 404 when no rule matches", async () => {
    vi.spyOn(reader, "getLatestRedirectRules").mockResolvedValue([
      {
        sourceUrl: "https://localhost:3000/old",
        destinationUrl: "https://target.com/old",
      },
    ]);

    await handleRedirect(fakeRequest as any, fakeReply as any);

    expect(fakeReply.code).toHaveBeenCalledWith(404);
    expect(fakeReply.send).toHaveBeenCalledWith("404 Not Found");
    expect(fakeLog.info).toHaveBeenCalledWith(
      { path: "/one?x=1" },
      "No matching rule -returning 404"
    );
  });

  it("returns 500 when rules are not available", async () => {
    vi.spyOn(reader, "getLatestRedirectRules").mockResolvedValue(null);

    await handleRedirect(fakeRequest as any, fakeReply as any);

    expect(fakeReply.code).toHaveBeenCalledWith(500);
    expect(fakeReply.send).toHaveBeenCalledWith("Redirect rules not available");
    expect(fakeLog.error).toHaveBeenCalledWith(
      "No Excel file found or failed to read rules."
    );
  });
});
