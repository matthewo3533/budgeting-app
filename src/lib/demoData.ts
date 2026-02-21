import type { BankTransaction } from "@/types/transaction";

/** Clearly synthetic dummy data for the Demo button – not from any real CSV. */
const DEMO_EXPENSE_MERCHANTS = [
  "Demo Grocery Store",
  "Demo Supermarket Central",
  "Demo Coffee Co",
  "Demo Pizza Place",
  "Demo Takeaways",
  "Demo Power & Gas",
  "Demo Insurance Ltd",
  "Demo Gym Membership",
  "Demo Streaming Service",
  "Demo Music Subscription",
  "Demo Petrol Station",
  "Demo Transport Authority",
  "Demo Pharmacy",
  "Demo Cafe",
  "Demo Bookshop",
  "Demo Hardware Store",
  "Demo Dentist",
  "Demo Phone Bill",
  "Demo Internet Provider",
  "Demo Charity Donation",
];

const DEMO_INCOME_SOURCES = [
  "Demo Salary Credit",
  "Demo Freelance Payment",
  "Demo Refund",
  "Demo Interest",
  "Demo Side Hustle",
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getDemoTransactions(): BankTransaction[] {
  const out: BankTransaction[] = [];
  const startDate = "2026-01-01";
  let balance = 3000;
  const baseId = `demo-${Date.now()}`;

  for (let day = 0; day < 42; day++) {
    const date = addDays(startDate, day);

    if (day % 7 === 0 && day > 0) {
      const amount = 500 + Math.round(Math.random() * 200);
      balance += amount;
      out.push({
        id: `${baseId}-in-${day}`,
        accountNumber: "DEMO-0000-0000000-00",
        effectiveDate: date,
        transactionDate: date,
        description: DEMO_INCOME_SOURCES[0],
        transactionCode: "DIRECT CREDIT",
        particulars: "",
        code: "",
        reference: "",
        otherPartyName: "Demo Employer",
        otherPartyAccountNumber: "",
        otherPartyParticulars: "",
        otherPartyCode: "",
        otherPartyReference: "",
        amount,
        balance,
      });
    }

    if (day % 10 === 0 && day > 0) {
      const desc = DEMO_INCOME_SOURCES[1 + (day % (DEMO_INCOME_SOURCES.length - 1))];
      const amount = 100 + Math.round(Math.random() * 150);
      balance += amount;
      out.push({
        id: `${baseId}-in2-${day}`,
        accountNumber: "DEMO-0000-0000000-00",
        effectiveDate: date,
        transactionDate: date,
        description: desc,
        transactionCode: "DIRECT CREDIT",
        particulars: "",
        code: "",
        reference: "",
        otherPartyName: "Demo Client",
        otherPartyAccountNumber: "",
        otherPartyParticulars: "",
        otherPartyCode: "",
        otherPartyReference: "",
        amount,
        balance,
      });
    }

    const numExpenses = 1 + Math.floor(Math.random() * 4);
    for (let e = 0; e < numExpenses; e++) {
      const desc = DEMO_EXPENSE_MERCHANTS[Math.floor(Math.random() * DEMO_EXPENSE_MERCHANTS.length)];
      const amount = -(3 + Math.random() * 65);
      const abs = Math.round(Math.abs(amount) * 100) / 100;
      balance += amount;
      out.push({
        id: `${baseId}-${day}-${e}`,
        accountNumber: "DEMO-0000-0000000-00",
        effectiveDate: date,
        transactionDate: date,
        description: desc,
        transactionCode: "EFTPOS PURCHASE",
        particulars: "",
        code: "",
        reference: "",
        otherPartyName: "",
        otherPartyAccountNumber: "",
        otherPartyParticulars: "",
        otherPartyCode: "",
        otherPartyReference: "",
        amount: -abs,
        balance: Math.round(balance * 100) / 100,
      });
    }
  }

  return out.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
}
