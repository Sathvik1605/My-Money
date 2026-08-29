import { z } from "zod";

const dateStringSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), "Must be a valid date (YYYY-MM-DD)");

export const cardNetworkSchema = z.enum(["Visa", "Mastercard", "Amex", "RuPay", "Diners"]);
export const statementStatusSchema = z.enum(["Unpaid", "Partially Paid", "Paid"]);

export const cardInputSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(100),
  bank_name: z.string().trim().min(1, "Bank name is required").max(100),
  network: cardNetworkSchema,
  last4_digits: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Must be exactly 4 digits"),
  credit_limit: z
    .union([z.number().nonnegative(), z.null()])
    .optional(),
  billing_cycle_start_day: z.number().int().min(1).max(31),
  statement_day: z.number().int().min(1).max(31),
  typical_due_days_after_statement: z.number().int().min(0).max(90),
});

export const cardUpdateSchema = cardInputSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const statementInputSchema = z
  .object({
    card_id: z.string().uuid(),
    cycle_start_date: dateStringSchema,
    cycle_end_date: dateStringSchema,
    statement_date: dateStringSchema,
    due_date: dateStringSchema,
    total_amount_due: z.number().nonnegative(),
    amount_paid: z.number().nonnegative().default(0),
    payment_date: dateStringSchema.nullable().optional(),
    status: statementStatusSchema.default("Unpaid"),
  })
  .refine((data) => new Date(data.cycle_end_date) >= new Date(data.cycle_start_date), {
    message: "cycle_end_date must be on or after cycle_start_date",
    path: ["cycle_end_date"],
  });

export const statementUpdateSchema = z
  .object({
    cycle_start_date: dateStringSchema.optional(),
    cycle_end_date: dateStringSchema.optional(),
    statement_date: dateStringSchema.optional(),
    due_date: dateStringSchema.optional(),
    total_amount_due: z.number().nonnegative().optional(),
    amount_paid: z.number().nonnegative().optional(),
    payment_date: dateStringSchema.nullable().optional(),
    status: statementStatusSchema.optional(),
  })
  .refine(
    (data) =>
      !data.cycle_start_date ||
      !data.cycle_end_date ||
      new Date(data.cycle_end_date) >= new Date(data.cycle_start_date),
    {
      message: "cycle_end_date must be on or after cycle_start_date",
      path: ["cycle_end_date"],
    }
  );
