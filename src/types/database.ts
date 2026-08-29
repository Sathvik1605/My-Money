// Hand-written types mirroring supabase/migrations/00000000000001_initial_schema.sql.
// If the schema changes, keep this in sync (or regenerate with
// `supabase gen types typescript --local`).

export type CardNetwork = "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";
export type StatementStatus = "Unpaid" | "Partially Paid" | "Paid";

// Plain type aliases (not interfaces) so they structurally satisfy
// supabase-js's `Record<string, unknown>` generic constraints.
export type Card = {
  id: string;
  user_id: string;
  nickname: string;
  bank_name: string;
  network: CardNetwork;
  last4_digits: string;
  credit_limit: number | null;
  billing_cycle_start_day: number;
  statement_day: number;
  typical_due_days_after_statement: number;
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
  amount_paid: number;
  payment_date: string | null;
  status: StatementStatus;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: Card;
        Insert: Omit<Card, "id" | "created_at" | "updated_at" | "is_active" | "credit_limit"> & {
          id?: string;
          is_active?: boolean;
          credit_limit?: number | null;
        };
        Update: Partial<Omit<Card, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      statements: {
        Row: Statement;
        Insert: Omit<Statement, "id" | "created_at" | "updated_at" | "amount_paid" | "status" | "payment_date"> & {
          id?: string;
          amount_paid?: number;
          status?: StatementStatus;
          payment_date?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      card_network: CardNetwork;
      statement_status: StatementStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
