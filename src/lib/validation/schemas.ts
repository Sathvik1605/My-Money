import { z } from "zod";

const dateStringSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), "Must be a valid date (YYYY-MM-DD)");

export const cardNetworkSchema = z.enum(["Visa", "Mastercard", "Amex", "RuPay", "Diners"]);

export const cardInputSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(100),
  bank_name: z.string().trim().min(1, "Bank name is required").max(100),
  network: cardNetworkSchema,
  last4_digits: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Must be exactly 4 digits"),
  credit_limit: z.number().nonnegative(),
  statement_day: z.number().int().min(1).max(31),
  due_day: z.number().int().min(1).max(31),
});

export const cardUpdateSchema = cardInputSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const cardDeleteSchema = z.object({
  confirm_delete: z.literal(true),
});

export const statementInputSchema = z.object({
  card_id: z.string().uuid(),
  statement_date: dateStringSchema,
  total_amount_due: z.number().nonnegative(),
});

export const statementUpdateSchema = z.object({
  statement_date: dateStringSchema.optional(),
  total_amount_due: z.number().nonnegative().optional(),
  mark_paid: z.literal(true).optional(),
  mark_unpaid: z.literal(true).optional(),
});

export const expenseCategorySchema = z.enum(["Need", "Want", "Investment"]);
const monthStringSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, "Must be the first day of a valid month");

export const expenseSectionInputSchema = z.object({
  category: expenseCategorySchema,
  name: z.string().trim().min(1, "Section name is required").max(100),
});

export const expenseSectionUpdateSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").max(100).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const expenseLineItemInputSchema = z.object({
  section_id: z.string().uuid(),
  name: z.string().trim().min(1, "Line item name is required").max(100),
});

export const expenseLineItemUpdateSchema = z.object({
  name: z.string().trim().min(1, "Line item name is required").max(100).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const expenseEntryInputSchema = z.object({
  section_id: z.string().uuid(),
  line_item_id: z.string().uuid().nullable(),
  month: monthStringSchema,
  amount: z.number().nonnegative(),
  unlock_closed_year: z.boolean().optional(),
});

export const monthlyIncomeInputSchema = z.object({
  month: monthStringSchema,
  amount: z.number().nonnegative(),
  unlock_closed_year: z.boolean().optional(),
});

export const destructiveConfirmSchema = z.object({
  confirm_delete: z.literal(true),
});
