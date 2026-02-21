import type { LucideIcon } from "lucide-react";
import {
  Home,
  Zap,
  Repeat,
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Fuel,
  Heart,
  Shield,
  Landmark,
  ShoppingBag,
  Gamepad2,
  Gift,
  GraduationCap,
  Sparkles,
  PiggyBank,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Building2,
  CircleDollarSign,
  Tag,
} from "lucide-react";
import type { CategoryId } from "@/types/transaction";

const EXPENSE_ICONS: Partial<Record<string, LucideIcon>> = {
  rent: Home,
  utilities: Zap,
  subscriptions: Repeat,
  groceries: ShoppingCart,
  dining: UtensilsCrossed,
  transport: Car,
  petrol: Fuel,
  healthcare: Heart,
  insurance: Shield,
  loans: Landmark,
  shopping: ShoppingBag,
  leisure: Gamepad2,
  gifts_donations: Gift,
  education: GraduationCap,
  personal_care: Sparkles,
  savings_transfer: PiggyBank,
  other: MoreHorizontal,
};

const INCOME_ICONS: Partial<Record<string, LucideIcon>> = {
  income_employment: Briefcase,
  income_self_employment: Laptop,
  income_investments: TrendingUp,
  income_rent: Home,
  income_government: Building2,
  income_other: CircleDollarSign,
};

const ALL_ICONS = { ...EXPENSE_ICONS, ...INCOME_ICONS };

/**
 * Returns the Lucide icon component for a category id.
 * Custom categories (custom_*) get a generic Tag icon.
 */
export function getCategoryIcon(id: CategoryId): LucideIcon {
  const builtIn = ALL_ICONS[id as keyof typeof ALL_ICONS];
  return builtIn ?? Tag;
}
