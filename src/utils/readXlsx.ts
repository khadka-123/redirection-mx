import * as XLSX from "xlsx";
import { z } from "zod";
import { join } from "path";
import type { FastifyBaseLogger } from "fastify";
import { NotFoundError } from "../middleware/app.error.js";


const RedirectEntrySchema = z.object({
  sourceUrl: z.string().url(),
  destinationUrl: z.string().url(),
});

/**
 * Reads and validates redirect rules from an Excel file.
 * @param logger Fastify logger
 * @returns Array of rules or null if file is missing.
 */
export async function getLatestRedirectRules(
  logger: FastifyBaseLogger
): Promise<null | Array<{
  sourceUrl: string;
  destinationUrl: string;
}>> {
  const fileName = join(process.cwd(), "redirects.xlsx");
  let workbook;
  try {
    workbook = XLSX.readFile(fileName);
  } catch (error) {
    logger.error(`Could not read file: ${fileName}`);
    return null;
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    logger.error("No sheets found in the Excel file");
  throw new NotFoundError("No sheets found in Excel file");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    logger.error({ sheetName }, "Worksheet not found in Excel file");
    throw new Error(`Worksheet "${sheetName}" not found`);
  }

  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const rules: Array<{ sourceUrl: string; destinationUrl: string }> = [];
  for (const row of rawData) {
    const entry = {
      sourceUrl: row["Source URL"],
      destinationUrl: row["Destination URL"],
    };
    try {
      const parsed = RedirectEntrySchema.parse(entry);
      rules.push(parsed);
    } catch (err) {
      logger.warn({ err, row }, "Skipping invalid Excel row");
    }
  }

  logger.debug({ count: rules.length }, "Loaded redirect rules");
  return rules;
}
