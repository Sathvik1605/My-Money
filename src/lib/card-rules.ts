/**
 * The due date for a statement. A later configured due day remains in the
 * statement month; an equal or earlier day belongs to the following month.
 */
export function dueDateForStatement(statementDate: string, dueDay: number): string {
  const statement = new Date(`${statementDate}T00:00:00Z`);
  const year = statement.getUTCFullYear();
  const month = statement.getUTCMonth();

  const dateInMonth = (targetYear: number, targetMonth: number) => {
    const monthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(targetYear, targetMonth, Math.min(dueDay, monthEnd)));
  };

  const dueMonth = dueDay <= statement.getUTCDate() ? month + 1 : month;
  return dateInMonth(year, dueMonth).toISOString().slice(0, 10);
}

export function isWithinCreditLimit(totalDue: number, creditLimit: number): boolean {
  return totalDue <= creditLimit;
}

/** Whether a statement belongs to a completed calendar month. */
export function isHistoricalStatement(statementDate: string, today = new Date()): boolean {
  const statement = new Date(`${statementDate}T00:00:00Z`);
  const currentMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return !Number.isNaN(statement.getTime()) && statement < currentMonth;
}
