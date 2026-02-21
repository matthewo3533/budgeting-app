import Papa from "papaparse";
import type { BankTransaction } from "@/types/transaction";

function parseNumber(value: string): number {
  const cleaned = String(value).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function parseBankCSV(csvText: string): BankTransaction[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = result.data;
  const out: BankTransaction[] = [];
  let id = 0;

  for (const row of rows) {
    const amount = parseNumber(row["Amount"] ?? "0");
    out.push({
      id: `tx-${++id}-${Date.now()}`,
      accountNumber: row["Account number"] ?? "",
      effectiveDate: row["Effective Date"] ?? "",
      transactionDate: row["Transaction Date"] ?? "",
      description: (row["Description"] ?? "").trim(),
      transactionCode: row["Transaction Code"] ?? "",
      particulars: row["Particulars"] ?? "",
      code: row["Code"] ?? "",
      reference: row["Reference"] ?? "",
      otherPartyName: row["Other Party Name"] ?? "",
      otherPartyAccountNumber: row["Other Party Account Number"] ?? "",
      otherPartyParticulars: row["Other Party Particulars"] ?? "",
      otherPartyCode: row["Other Party Code"] ?? "",
      otherPartyReference: row["Other Party Reference"] ?? "",
      amount,
      balance: parseNumber(row["Balance"] ?? "0"),
    });
  }

  return out;
}

export function getDisplayDescription(tx: BankTransaction): string {
  return tx.description || tx.otherPartyName || "Unknown";
}

/** Normalise for comparison: lowercase, collapse spaces. */
export function normaliseDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if two descriptions refer to the same/similar merchant. */
export function isSimilarDescription(a: string, b: string): boolean {
  const na = normaliseDescription(a);
  const nb = normaliseDescription(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

// Phrases that don't help identify the merchant (strip from start of description).
const STRIP_PREFIXES = [
  /^transfer\s+from\s+/i,
  /^transfer\s+to\s+/i,
  /^direct\s+credit\s+/i,
  /^direct\s+debit\s+/i,
  /^direct\s+credit\s*[-–]?\s*/i,
  /^direct\s+debit\s*[-–]?\s*/i,
  /^eftpos\s+purchase\s*/i,
  /^pos\s+w\/d\s+.*?\s+/i, // "POS W/D 44.16USD ... DIGITALOCEAN" -> keep DIGITALOCEAN part
  /^bill\s+payment\s+/i,
  /^pay\s+/i,
  /^debit\s+transfer\s*/i,
  /^credit\s+transfer\s*/i,
  /^ap#\d+\s+to\s+/i,
  /^ap#\d+\s+/i,
  /^ref:\s*\S+\s+/i,
  /^inv-\d+\s+/i,
  /^trf\s+\S+\s+/i,
  /^stripe\s+payments?\s+ref:\s*\S+\s+/i,
];

// Remove trailing ref/inv noise so "Merchant Name REF: 123" -> "Merchant Name"
function stripTrailingNoise(s: string): string {
  return s
    .replace(/\s+ref[:\s]+\S+$/i, "")
    .replace(/\s+inv[-\s]+\S+$/i, "")
    .replace(/\s+\d{8,}$/, "") // long numbers at end
    .trim();
}

/** Strip bank boilerplate to get the meaningful merchant/payee part. */
function stripBankBoilerplate(description: string): string {
  let out = description.trim();
  for (const re of STRIP_PREFIXES) {
    out = out.replace(re, " ");
  }
  // If POS W/D left "DIGITALOCEAN.COM ..." we might have leading domain – take first segment
  out = out.replace(/\s+/g, " ").trim();
  return stripTrailingNoise(out);
}

/** True if the other party name looks meaningful (not a ref number or too generic). */
function isMeaningfulOtherParty(name: string): boolean {
  const n = name.trim();
  if (n.length < 2) return false;
  if (/^\d+$/.test(n)) return false;
  if (/^ref\s*:?\s*\d+/i.test(n)) return false;
  if (/^inv[- ]?\d+/i.test(n)) return false;
  return true;
}

/**
 * Get the best single string to use for grouping: prefer Other Party when meaningful,
 * otherwise strip bank phrases from description.
 */
export function getMeaningfulDescription(tx: BankTransaction): string {
  if (tx.otherPartyName && isMeaningfulOtherParty(tx.otherPartyName)) {
    return tx.otherPartyName.trim();
  }
  const fromDesc = stripBankBoilerplate(tx.description || "");
  if (fromDesc.length >= 2) return fromDesc;
  return getDisplayDescription(tx);
}

/**
 * Group key for "similar" transactions. Uses meaningful description (Other Party or
 * stripped description), normalized, then first 10 chars so e.g. "New World Hillcrest"
 * and "New World Lynden" group under "newworld".
 */
export function getGroupKey(tx: BankTransaction): string {
  const meaningful = getMeaningfulDescription(tx);
  const normalized = normaliseDescription(meaningful)
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "") // drop punctuation for consistency
    .replace(/\s/g, "");
  const key = normalized.slice(0, 10);
  return key || "other";
}

/** Legacy: group key from description string only (for callers that don't have full tx). */
export function getGroupKeyFromDescription(description: string): string {
  const stripped = stripBankBoilerplate(description);
  const normalized = normaliseDescription(stripped)
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s/g, "");
  return normalized.slice(0, 10) || "other";
}
