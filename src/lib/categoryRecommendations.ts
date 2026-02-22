import type { BankTransaction, CategoryId } from "@/types/transaction";
import { getSearchableTransactionText } from "@/lib/csvParser";

type Rule = { keywords: string[]; category: CategoryId };

/** NZ typical amount range (NZD) for a single transaction – used to suggest category when no keyword matches. */
type AmountBand = { category: CategoryId; min: number; max: number };

/**
 * Keyword rules for expense categories.
 * Order matters: first match wins. Put more specific rules first.
 */
const EXPENSE_RULES: Rule[] = [
  // Petrol / fuel
  {
    keywords: [
      "fuel", "petrol", "gas station", "bp ", "bp.", "shell ", "mobil ", "caltex",
      "z energy", "gull ", "pak'n'save fuel", "countdown fuel", "gas ", "unleaded",
      "diesel", "service station", "fuel stop",
    ],
    category: "petrol",
  },
  // Rent (incl. NZ reference/particulars: rent payment, landlord names)
  {
    keywords: [
      "rent", "lease", "tenancy", "property management", "barfoot", "ray white",
      "harcourts", "trademe rent", "rental", "landlord", "bond ", "tenancy services",
      "apartment rent", "flat rent", "mortgage payment", "homeloan",
      "rent payment", "rental payment", "weekly rent", "board ",
    ],
    category: "rent",
  },
  // Utilities (incl. NZ power companies and reference text)
  {
    keywords: [
      "power", "electricity", "meridian", "contact energy", "genesis", "trustpower",
      "nova energy", "electric ", "gas bill", "water bill", "watercare", "vector",
      "orion", "wellington electricity", "powershop", "flick", "octopus",
      "powershop wellington", "electricity account", "power account",
    ],
    category: "utilities",
  },
  // Insurance (incl. NZ insurers and statement text like "TOWER INSURANCE - EIS")
  {
    keywords: [
      "insurance", "aa insurance", "state insurance", "tower ", "tower insurance",
      "ami ", "vero", "suncorp", "nib ", "southern cross", "acc ", "health insurance",
      "car insurance", "contents insurance", "house insurance", "life insurance", "premium",
      " - eis ", "eis ", "tower insurance - eis",
    ],
    category: "insurance",
  },
  // Self employment costs (business tools, SaaS, invoice refs like INV-)
  {
    keywords: [
      "xero", "quickbooks", "myob", "wave apps", "xero nz", "inv-", "inv ",
      "google workspace", "google ads", "microsoft 365", "office 365", "slack",
      "shopify", "square ", "stripe", "paypal business", "squareup",
      "digitalocean", "digitalocean.com", "aws ", "amazon web services", "linode", "vultr", "heroku",
      "cursor", "cursor.com", "github", "gitlab", "bitbucket", "atlassian",
      "twilio", "sendgrid", "mailchimp", "hubspot", "zendesk", "intercom",
      "notion", "canva", "figma", "adobe creative", "dropbox", "zoom",
      "domain", "namecheap", "godaddy", "hosting", "cloudflare",
      "squarespace", "wix", "wordpress", "webflow",
      "linkedin sales", "salesforce", "pipedrive", "freshbooks",
    ],
    category: "self_employment_costs",
  },
  // Subscriptions
  {
    keywords: [
      "netflix", "spotify", "amazon prime", "disney", "disney+", "youtube premium",
      "apple music", "apple tv", "google one", "dropbox", "icloud", "subscription",
      "membership", "patreon", "onlyfans", "xbox live", "playstation", "nintendo",
      "audible", "kindle", "adobe", "microsoft 365", "office 365", "zoom",
      "linkedin premium", "canva", "notion", "spotify", "deezer", "tidal",
    ],
    category: "subscriptions",
  },
  // Dining & takeout
  {
    keywords: [
      "meal", "food", "cafe", "coffee", "mcdonald", "maccas", "burger king", "kfc",
      "subway", "pizza", "domino", "pizza hut", "ubereats", "doordash", "deliveroo",
      "menulog", "takeaway", "take away", "take-out", "takeout", "restaurant",
      "café", "bakery", "brunch", "lunch", "dinner", "breakfast", "starbucks",
      "costa", "gloria jean", "muffin break", "espresso", "sushi", "thai",
      "indian", "chinese", "noodle", "burger", "fries", "fish and chip",
      "hell pizza", "sal's pizza", "wendy's", "taco bell", "chipotle",
      "grill'd", "nandos", "red rooster", "hungry jack", "dunkin",
    ],
    category: "dining",
  },
  // Groceries
  {
    keywords: [
      "countdown", "new world", "pak'n'save", "pak n save", "woolworths", "coles",
      "aldi", "foodstuffs", "progressive", "supermarket", "grocer", "grocery",
      "fresh choice", "super value", "four square", "butcher", "green grocer",
      "fruit shop", "vegetable", "dairy", "bakery", "baker", "ig a", "costco",
    ],
    category: "groceries",
  },
  // Transport
  {
    keywords: [
      "uber", "lyft", "taxi", "cab", "bus ", "train", "ferry", "at hop",
      "snapper", "hop card", "public transport", "transdev", "rideline",
      "airport", "parking", "wilson parking", "parking meter", "parkable",
      "cityhop", "zoomy", "ola", "didi", "pt ", "metlink", "auckland transport",
    ],
    category: "transport",
  },
  // Healthcare
  {
    keywords: [
      "doctor", "gp ", "medical", "pharmacy", "chemist", "hospital", "dentist",
      "optician", "physio", "physiotherapy", "clinic", "prescription", "medicine",
      "pharmacist", "green cross", "life pharmacy", "unichem", "terry white",
    ],
    category: "healthcare",
  },
  // Buy now pay later
  {
    keywords: [
      "afterpay", "after pay", "zip pay", "zip money", "zippay", "zipmoney",
      "laybuy", "lay buy", "humm", "klarna", "openpay", "paypal pay in 4",
      "pay in 4", "bnpl", "sezzle", "splitit", "latitudepay", "bundll",
    ],
    category: "buy_now_pay_later",
  },
  // Loans & debt (incl. NZ direct debit references: MTF, collection trust)
  {
    keywords: [
      "loan", "repayment", "mortgage", "homeloan", "finance", "credit card",
      "overdraft", "interest", "debt", "debt collection", "student loan", "ird loan",
      "mtf ", "mtf payment", "mtf collection", "collection trust", "mtf collection trust",
      "direct debit", "automatic payment", "ap#", "standing order",
    ],
    category: "loans",
  },
  // Shopping (retail, general)
  {
    keywords: [
      "warehouse", "kmart", "target", "big w", "bunnings", "mitre 10", "placemakers",
      "noel leeming", "jb hi-fi", "harvey norman", "pb tech", "mighty ape",
      "amazon.", "ebay", "trademe", "marketplace", "retail", "store", "shop ",
      "farmers", "david jones", "myer", "rebel ", "athlete's foot", "foot locker",
    ],
    category: "shopping",
  },
  // Leisure & entertainment
  {
    keywords: [
      "cinema", "movie", "event", "ticket", "concert", "theatre", "theater",
      "gym", "fitness", "les mills", "city fitness", "swim", "pool", "sports",
      "game ", "steam", "playstation store", "xbox store", "nintendo eshop",
      "pub", "bar ", "nightclub", "casino", "lottery", "lotto", "tab",
      "museum", "gallery", "zoo", "theme park", "skyline", "entertainment",
    ],
    category: "leisure",
  },
  // Gifts & donations
  {
    keywords: [
      "donation", "donate", "charity", "givealittle", "red cross", "salvation",
      "gift", "present", "koha", "tip ", "gofundme", "kickstarter", "patreon",
    ],
    category: "gifts_donations",
  },
  // Education
  {
    keywords: [
      "university", "uni ", "polytechnic", "school", "tuition", "course",
      "udemy", "coursera", "edx", "skillshare", "masterclass", "education",
      "student", "enrollment", "enrolment", "textbook", "library",
    ],
    category: "education",
  },
  // Personal care
  {
    keywords: [
      "haircut", "hairdresser", "salon", "barber", "spa", "massage",
      "beauty", "cosmetic", "pharmacy", "chemist warehouse", "personal care",
    ],
    category: "personal_care",
  },
  // Savings & transfers
  {
    keywords: [
      "transfer", "savings", "kiwisaver", "kiwi saver", "investment", "transfer to",
      "withdrawal", "sharesies", "internal transfer", "payroll", "direct debit", "standing order",
    ],
    category: "savings_transfer",
  },
];

/**
 * Keyword rules for income categories.
 */
const INCOME_RULES: Rule[] = [
  {
    keywords: [
      "salary", "wage", "payroll", "pay ", "employment", "employer", "income",
      "direct credit salary", "wages", "fortnightly", "monthly pay", "pay slip",
    ],
    category: "income_employment",
  },
  {
    keywords: [
      "freelance", "contract", "invoice", "self employed", "sole trader",
      "consulting", "consultant", "gig", "upwork", "fiverr", "paypal",
    ],
    category: "income_self_employment",
  },
  {
    keywords: [
      "dividend", "interest", "investment", "shares", "fund", "kiwisaver",
      "savings interest", "term deposit", "bond", "etf", "portfolio",
    ],
    category: "income_investments",
  },
  {
    keywords: [
      "rent", "tenant", "rental income", "property income", "boarder",
    ],
    category: "income_rent",
  },
  {
    keywords: [
      "winz", "work and income", "benefit", "acc", "government", "ird refund",
      "tax refund", "child support", "maintenance", "pension", "superannuation",
    ],
    category: "income_government",
  },
];

/**
 * NZ typical transaction amounts (NZD) – used when no keyword matches.
 * Based on Stats NZ, Power Compare, MoneyHub, Canstar 2024–2025.
 * Single-transaction bands; order matters (first match wins for overlapping ranges).
 */
const NZ_EXPENSE_AMOUNT_BANDS: AmountBand[] = [
  { category: "subscriptions", min: 8, max: 35 },        // Netflix, Spotify – very distinctive
  { category: "utilities", min: 140, max: 320 },         // Monthly power ~$195–$268
  { category: "insurance", min: 45, max: 280 },        // Car/contents/house
  { category: "rent", min: 320, max: 750 },            // Weekly rent
  { category: "rent", min: 750, max: 1600 },            // Fortnightly rent
  { category: "rent", min: 1400, max: 4200 },          // Monthly rent
  { category: "loans", min: 50, max: 350 },             // Car/personal repayment
  { category: "loans", min: 800, max: 3500 },           // Mortgage
  { category: "dining", min: 3, max: 85 },              // Café, takeaway (before groceries)
  { category: "groceries", min: 25, max: 120 },         // Small shop
  { category: "groceries", min: 120, max: 380 },       // Weekly grocery run
  { category: "petrol", min: 35, max: 130 },            // Typical fill
  { category: "transport", min: 8, max: 90 },           // Uber, parking
  { category: "healthcare", min: 15, max: 250 },        // GP, pharmacy
  { category: "buy_now_pay_later", min: 15, max: 550 }, // BNPL
  { category: "personal_care", min: 15, max: 120 },     // Haircut, salon
  { category: "education", min: 20, max: 500 },         // Course, textbook
];

/** Income: typical salary (fortnightly/monthly), benefit, refund. */
const NZ_INCOME_AMOUNT_BANDS: AmountBand[] = [
  { category: "income_government", min: 300, max: 800 },   // Benefit fortnightly
  { category: "income_employment", min: 1200, max: 4500 }, // Fortnightly salary
  { category: "income_employment", min: 2600, max: 9500 }, // Monthly salary
  { category: "income_rent", min: 300, max: 2500 },        // Board/rental income
  { category: "income_self_employment", min: 100, max: 50000 }, // Invoice (wide)
  { category: "income_government", min: 50, max: 5000 },     // IRD refund, ACC
];

function matchRules(text: string, rules: Rule[]): CategoryId | null {
  const lower = text.toLowerCase().trim();
  for (const { keywords, category } of rules) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return category;
    }
  }
  return null;
}

/** Suggest category from amount only (NZ typical bands). Used when keyword match fails. */
function matchByAmount(amountNzd: number, isIncome: boolean): CategoryId | null {
  const bands = isIncome ? NZ_INCOME_AMOUNT_BANDS : NZ_EXPENSE_AMOUNT_BANDS;
  for (const { category, min, max } of bands) {
    if (amountNzd >= min && amountNzd <= max) return category;
  }
  return null;
}

/**
 * Get the recommended category for a transaction based on its description only.
 * For full context (reference fields + amount), use getRecommendedCategoryFromTransaction.
 * Returns null if no rule matches.
 */
export function getRecommendedCategory(
  description: string,
  isIncome: boolean
): CategoryId | null {
  const rules = isIncome ? INCOME_RULES : EXPENSE_RULES;
  return matchRules(description, rules);
}

/**
 * Advanced recommendation using all CSV fields and NZ amount data.
 * 1) Builds searchable text from description, reference, particulars, code, other party fields.
 * 2) Runs keyword rules (incl. NZ reference patterns: MTF, INV-, Tower EIS, etc.).
 * 3) If no keyword match, suggests from NZ typical amount bands (rent, power, subscriptions, etc.).
 */
export function getRecommendedCategoryFromTransaction(tx: BankTransaction): CategoryId | null {
  const searchableText = getSearchableTransactionText(tx);
  const isIncome = tx.amount > 0;
  const absAmount = Math.abs(tx.amount);

  const keywordMatch = matchRules(searchableText, isIncome ? INCOME_RULES : EXPENSE_RULES);
  if (keywordMatch) return keywordMatch;

  return matchByAmount(absAmount, isIncome);
}

/**
 * Get all categories that could match (for future use, e.g. showing multiple suggestions).
 * Uses description only. For full transaction context use getRecommendedCategoryFromTransaction.
 */
export function getRecommendedCategories(
  description: string,
  isIncome: boolean
): CategoryId[] {
  const lower = description.toLowerCase().trim();
  const rules = isIncome ? INCOME_RULES : EXPENSE_RULES;
  const seen = new Set<CategoryId>();
  const result: CategoryId[] = [];
  for (const { keywords, category } of rules) {
    if (seen.has(category)) continue;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        seen.add(category);
        result.push(category);
        break;
      }
    }
  }
  return result;
}
