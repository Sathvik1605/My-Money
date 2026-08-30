// Hand-written types mirroring supabase/migrations/00000000000001_initial_schema.sql.
// If the schema changes, keep this in sync (or regenerate with
// `supabase gen types typescript --local`).

export type CardNetwork = "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";
export type ExpenseCategory = "Need" | "Want" | "Investment";

// Plain type aliases (not interfaces) so they structurally satisfy
// supabase-js's `Record<string, unknown>` generic constraints.
export type Card = {
  id: string;
  user_id: string;
  nickname: string;
  bank_name: string;
  network: CardNetwork;
  last4_digits: string;
  credit_limit: number;
  statement_day: number;
  due_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Statement = {
  id: string;
  card_id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  statement_date: string;
  due_date: string;
  total_amount_due: number;
  payment_date: string | null;
  historical_payment_confirmed: boolean;
  created_at: string;
  updated_at: string;
};

export type ExpenseSection = {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExpenseLineItem = {
  id: string;
  section_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExpenseEntry = {
  id: string;
  user_id: string;
  section_id: string;
  line_item_id: string | null;
  month: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyIncome = {
  id: string;
  user_id: string;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: Card;
        Insert: Omit<Card, "id" | "created_at" | "updated_at" | "is_active"> & {
          id?: string;
          is_active?: boolean;
        };
        Update: Partial<Omit<Card, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      statements: {
        Row: Statement;
        Insert: Omit<Statement, "id" | "created_at" | "updated_at" | "payment_date" | "historical_payment_confirmed"> & {
          id?: string;
          payment_date?: string | null;
          historical_payment_confirmed?: boolean;
        };
        Update: Partial<Omit<Statement, "id" | "card_id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "statements_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_sections: {
        Row: ExpenseSection;
        Insert: Omit<ExpenseSection, "id" | "created_at" | "updated_at" | "is_active" | "sort_order"> & {
          id?: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Omit<ExpenseSection, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      expense_line_items: {
        Row: ExpenseLineItem;
        Insert: Omit<ExpenseLineItem, "id" | "created_at" | "updated_at" | "is_active" | "sort_order"> & {
          id?: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Omit<ExpenseLineItem, "id" | "section_id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "expense_line_items_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "expense_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_entries: {
        Row: ExpenseEntry;
        Insert: Omit<ExpenseEntry, "id" | "created_at" | "updated_at" | "notes"> & {
          id?: string;
          notes?: string | null;
        };
        Update: Partial<Omit<ExpenseEntry, "id" | "user_id" | "section_id" | "line_item_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      monthly_income: {
        Row: MonthlyIncome;
        Insert: Omit<MonthlyIncome, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<MonthlyIncome, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      card_network: CardNetwork;
      expense_category: ExpenseCategory;
    };
    CompositeTypes: Record<string, never>;
  };
};
