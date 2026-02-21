import type { CategoryId } from "@/types/transaction";

type Rule = { keywords: string[]; category: CategoryId };

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
  // Rent
  {
    keywords: [
      "rent", "lease", "tenancy", "property management", "barfoot", "ray white",
      "harcourts", "trademe rent", "rental", "landlord", "bond ", "tenancy services",
      "apartment rent", "flat rent", "mortgage payment", "homeloan",
    ],
    category: "rent",
  },
  // Utilities
  {
    keywords: [
      "power", "electricity", "meridian", "contact energy", "genesis", "trustpower",
      "nova energy", "electric ", "gas bill", "water bill", "watercare", "vector",
      "orion", "wellington electricity", "powershop", "flick", "octopus",
    ],
    category: "utilities",
  },
  // Insurance
  {
    keywords: [
      "insurance", "aa insurance", "state insurance", "tower ", "ami ", "vero",
      "suncorp", "nib ", "southern cross", "acc ", "health insurance", "car insurance",
      "contents insurance", "house insurance", "life insurance", "premium",
    ],
    category: "insurance",
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
  // Loans & debt
  {
    keywords: [
      "loan", "repayment", "mortgage", "homeloan", "finance", "afterpay",
      "zip pay", "zip money", "laybuy", "humm", "credit card", "overdraft",
      "interest", "bnpl", "debt", "debt collection", "student loan", "ird loan",
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

function matchRules(text: string, rules: Rule[]): CategoryId | null {
  const lower = text.toLowerCase().trim();
  for (const { keywords, category } of rules) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return category;
    }
  }
  return null;
}

/**
 * Get the recommended category for a transaction based on its description.
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
 * Get all categories that could match (for future use, e.g. showing multiple suggestions).
 * Returns in order of first keyword match.
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
