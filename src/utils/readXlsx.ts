import * as XLSX from "xlsx";
import { z } from "zod";
import {join} from 'path';
import type {FastifyBaseLogger} from 'fastify';

// Zod schema for a redirect entry (each row must have valid URLs)
const RedirectEntrySchema = z.object({
  sourceUrl: z.string().url(),
  destinationUrl: z.string().url(),
  statusCode: z.number().int().optional(),
});

/**
 * 
 * @param logger It reieves piono logger as param
 * @returns Returns an array of redirect rules, or null if no file is found
 */
export async function getLatestRedirectRules(logger:FastifyBaseLogger): Promise<null | Array<{
  sourceUrl: string;
  destinationUrl: string;
  statusCode: number;
}>> {
  // Read the Excel file
  const fileName = join(process.cwd(), "redirects.xlsx");
  let workbook;
  try{
    workbook=XLSX.readFile(fileName);
  }catch(error){
    logger.error(`Could not read file: ${fileName}`);
    return null;
  }
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    logger.error("No sheets found in the Excel file");
    throw new Error("No sheets found");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    logger.error({sheetName},"Worksheet not found in Excel file");
    throw new Error(`Worksheet "${sheetName}" not found`);
  }

  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  // Validate and transform rows
  const rules: Array<{
    sourceUrl: string;
    destinationUrl: string;
    statusCode: number;
  }> = [];
  for (const row of rawData) {
    // Map Excel columns to our object keys
    const entry = {
      sourceUrl: row["Source URL"],
      destinationUrl: row["Destination URL"],
      statusCode: row["Status Code"] ?? 301,
    };
    try {
      // Validate the entry with Zod; parse() throws if invalid
      const parsed = RedirectEntrySchema.parse(entry);
      rules.push({
        sourceUrl: parsed.sourceUrl,
        destinationUrl: parsed.destinationUrl,
        statusCode: parsed.statusCode || 301,
      });
    } catch (err) {
      logger.warn({err,row},"Skipping invalid Excel row");
    }
  }
  logger.debug({count:rules.length},"Loaded redirect rules");
  return rules;
}
