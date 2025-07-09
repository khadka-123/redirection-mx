import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FastifyBaseLogger } from "fastify";
import type { Mock } from "vitest";

//  mocking for XLSX
vi.mock("xlsx", async () => {
  const actual = await vi.importActual<any>("xlsx");
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

import * as XLSX from "xlsx";
import { getLatestRedirectRules } from "../src/utils/readXlsx";

describe("getLatestRedirectRules", () => {
  let fakeLogger: FastifyBaseLogger;

  beforeEach(() => {
    fakeLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when the file cannot be read", async () => {
    // Make XLSX.readFile throw error
    (XLSX.readFile as unknown as Mock).mockImplementation(() => {
      throw new Error("ENOENT: no such file");
    });

    const rules = await getLatestRedirectRules(fakeLogger);
    expect(rules).toBeNull();

    // Updated to match the actual implementation
    expect(fakeLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Could not read file:")
    );
  });

  it("throws if no sheets are present", async () => {
    // Return a workbook with no sheets
    (XLSX.readFile as unknown as Mock).mockReturnValue({
      SheetNames: [],
      Sheets: {},
    });

    await expect(getLatestRedirectRules(fakeLogger)).rejects.toThrow("No sheets found");
    expect(fakeLogger.error).toHaveBeenCalledWith("No sheets found in the Excel file");
  });

  it("skips invalid rows and returns only valid rules", async () => {
    // Build a fake worksheet with valid + invalid rows
    const ws = XLSX.utils.aoa_to_sheet([
      ["Source URL", "Destination URL", "Status Code"],
      ["https://a.com/one", "https://b.com/one", 301],
      ["not-a-url",         "https://b.com/two", 302],
    ]);
    const fakeWb = { SheetNames: ["Sheet1"], Sheets: { Sheet1: ws } };

    (XLSX.readFile as unknown as Mock).mockReturnValue(fakeWb);

    const rules = await getLatestRedirectRules(fakeLogger);

    expect(rules).toHaveLength(1);
    expect(rules![0]).toEqual({
      sourceUrl: "https://a.com/one",
      destinationUrl: "https://b.com/one",
      statusCode: 301,
    });

    expect(fakeLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.anything(),
        row: expect.objectContaining({ "Source URL": "not-a-url" }),
      }),
      "Skipping invalid Excel row"
    );

    expect(fakeLogger.debug).toHaveBeenCalledWith(
      { count: 1 },
      "Loaded redirect rules"
    );
  });
});
