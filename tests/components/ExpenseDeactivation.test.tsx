import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const categoryPage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "expenses", "[category]", "page.tsx"),
  "utf8",
);
const sectionPage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "expenses", "[category]", "[sectionId]", "page.tsx"),
  "utf8",
);
const expensesRoute = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "api", "expenses", "route.ts"),
  "utf8",
);
const expensesPage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "expenses", "page.tsx"),
  "utf8",
);
const globalStyles = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "globals.css"),
  "utf8",
);
const billOverviewPage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "page.tsx"),
  "utf8",
);
const cardsPage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "cards", "page.tsx"),
  "utf8",
);
const expenseSummaryPage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "expenses", "summary", "page.tsx"),
  "utf8",
);
const expenseIncomePage = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "expenses", "income", "page.tsx"),
  "utf8",
);

describe("Expense deletion controls", () => {
  it("confirms before permanently deleting a section or line item", () => {
    for (const page of [categoryPage, sectionPage]) {
      expect(page).toContain("Delete permanently");
      expect(page).toContain("method: \"DELETE\"");
      expect(page).toContain("confirm_delete: true");
      expect(page).toContain("This cannot be undone");
    }
  });

  it("only reveals destructive icons after the user enters delete mode", () => {
    expect(categoryPage).toContain("Delete Sub category");
    expect(categoryPage).toContain("duration-[var(--duration-standard)] ease-out");
    expect(categoryPage).toContain("deletingSections ? \"w-11 opacity-100\"");
    expect(sectionPage).toContain("Delete items");
    expect(sectionPage).toContain("duration-[var(--duration-standard)] ease-out");
    expect(sectionPage).toContain("deletingItems ? \"w-11 opacity-100\"");
  });

  it("uses the same solid destructive action for every permanent deletion confirmation", () => {
    for (const page of [categoryPage, sectionPage]) {
      expect(page).toContain('className="btn-destructive"');
    }
    expect(globalStyles).toContain(".btn-destructive");
    expect(globalStyles).toContain("color: var(--color-on-destructive)");
  });

  it("uses the parent category color for page titles only", () => {
    expect(categoryPage).toContain("titleClassName={categoryColors[category]}");
    expect(categoryPage).not.toContain("hover:underline ${categoryColors[category]}");
    expect(sectionPage).toContain("section ? categoryColors[section.category] : categoryRouteColors[category]");
    expect(sectionPage).not.toContain("${section ? categoryColors[section.category] : \"\"}");
  });

  it("does not show a stale or placeholder title while a nested category page loads", () => {
    expect(categoryPage).toContain('query: { title: section.name }');
    expect(sectionPage).toContain('initialTitle={searchParams.get("title")}');
    expect(sectionPage).toContain("const displayTitle = section?.name ?? initialTitle");
    expect(sectionPage).toContain("categoryRouteColors[category]");
    expect(sectionPage).toContain("<ExpenseSectionContent key={sectionId} category={category} sectionId={sectionId} initialTitle={searchParams.get(\"title\")} />");
    expect(sectionPage).toContain("const [loading, setLoading] = useState(true)");
    expect(sectionPage).toContain('role="status" aria-live="polite" aria-busy="true"');
    expect(sectionPage).toContain("loading && <p");
    expect(sectionPage).not.toContain('title={section?.name ?? "Section"}');
  });

  it("provides explicit parent navigation from subcategories and item pages", () => {
    expect(categoryPage).toContain('href="/expenses">Back to all categories</Link>');
    expect(sectionPage).toContain('href={`/expenses/${category}`}>Back to {section?.category ?? category}</Link>');
  });

  it("keeps financial year, calendar year, and direct year selection in Expense Entry", () => {
    expect(expensesPage).toContain('aria-label="Year type"');
    expect(expensesPage).toContain('"Financial year"');
    expect(expensesPage).toContain('"Calendar year"');
    expect(expensesPage).toContain('ariaLabel="Select expense year"');
    expect(expensesPage).toContain('className="segmented"');
    expect(expensesPage).toContain('className="year-select w-36"');
    expect(expensesPage).toContain('aria-label="Previous year"');
    expect(expensesPage).toContain('aria-label="Next year"');
    expect(expensesPage).not.toContain('href="/expenses/income"');
    expect(expensesPage.indexOf('ariaLabel="Select expense year"')).toBeLessThan(
      expensesPage.indexOf('aria-label="Year type"'),
    );
  });

  it("uses the shared year navigation and accessible period toggle in Expense Summary", () => {
    expect(expenseSummaryPage).toContain('aria-label="Previous year"');
    expect(expenseSummaryPage).toContain('aria-label="Next year"');
    expect(expenseSummaryPage).toContain('aria-label="Year type"');
    expect(expenseSummaryPage).toContain('tabIndex={type === yearType ? 0 : -1}');
    expect(expenseSummaryPage.indexOf('ariaLabel="Select summary year"')).toBeLessThan(
      expenseSummaryPage.indexOf('aria-label="Year type"'),
    );
  });

  it("uses the standard dropdown geometry for direct year selection", () => {
    expect(globalStyles).not.toContain(".year-select .dropdown-trigger");
    expect(globalStyles).not.toContain(".year-select .dropdown-menu");
    expect(globalStyles).toContain("border-radius: var(--radius-sm)");
  });

  it("alternates Expense Entry month-column surfaces for readable yearly scanning", () => {
    expect(expensesPage).toContain('index % 2 === 0 ? "bg-[var(--color-canvas-soft)]" : "bg-[var(--color-canvas)]"');
    expect(expensesPage).toContain('min-w-52 bg-[var(--color-canvas-soft)]');
  });

  it("shows section, month, and grand totals in Expense Entry", () => {
    expect(expensesPage).toContain("const monthTotal");
    expect(expensesPage).toContain("const sectionTotal");
    expect(expensesPage).toContain("const grandTotal");
    expect(expensesPage).toContain('>Total</th>');
    expect(expensesPage).toContain('colSpan={2}');
    expect(expensesPage).toContain("formatCurrency(grandTotal)");
  });

  it("keeps the category legend outside the scrolling Expense Entry table", () => {
    expect(expensesPage).toContain('<div className="card-surface mt-6">');
    expect(expensesPage).toContain('gap-3 border-b border-[var(--color-hairline)] px-4 py-1');
    expect(expensesPage).toContain('min-h-11 items-center gap-1.5');
    expect(expensesPage).toContain('<div className="overflow-x-auto rounded-b-[var(--radius-md)]">');
    expect(expensesPage).toContain('sticky left-0 z-20');
    expect(expensesPage).toContain('sticky left-3 z-20');
  });

  it("uses the shared balanced application gutter for every workspace page", () => {
    for (const page of [
      billOverviewPage,
      cardsPage,
      expensesPage,
      expenseSummaryPage,
      expenseIncomePage,
      categoryPage,
      sectionPage,
    ]) {
      expect(page).toContain('className="app-page mx-auto"');
    }
    expect(globalStyles).toContain("--content-width: 1440px");
    expect(globalStyles).toContain("padding-inline: var(--space-xl)");
    expect(globalStyles).toContain("padding-inline: var(--space-section)");
    expect(globalStyles).toContain("padding-block: var(--space-xl)");
  });

  it("centers every two-column expense data surface with the compact-table rule", () => {
    for (const page of [expenseIncomePage, categoryPage, sectionPage]) {
      expect(page).toContain("card-surface table-compact mt-6");
      expect(page).toContain('className="content-compact"');
    }
    expect(globalStyles).toContain(".content-compact");
    expect(globalStyles).toContain("max-width: calc(var(--space-section) * 9)");
  });

  it("uses the shared larger bold table-header treatment for Section and month labels", () => {
    expect(expensesPage).toContain("table-header sticky left-3 z-20 min-w-52 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-left");
    expect(expensesPage).toContain('table-header min-w-32 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-right');
    expect(globalStyles).toContain(".table-header");
    expect(globalStyles).toContain("font-size: 16px");
    expect(globalStyles).toContain("font-weight: var(--font-weight-semibold)");
    expect(globalStyles).toContain("color: var(--color-ink)");
  });

  it("uses 12px category strips and matching pinned Section offsets in Expense Entry", () => {
    expect(expensesPage).toContain("sticky left-0 z-20 w-3");
    expect(expensesPage).toContain("sticky left-0 z-10 w-3");
    expect(expensesPage).toContain("sticky left-3 z-10 bg-[var(--color-canvas)]");
    expect(expensesPage).not.toContain("sticky left-6");
  });

  it("uses compact shared-scale padding for all Bill Overview summary cards", () => {
    expect(billOverviewPage.match(/card-soft flex items-center justify-between gap-2 p-2/g)).toHaveLength(4);
    expect(billOverviewPage).not.toContain("card-soft p-3");
    expect(billOverviewPage.match(/text-\[20px\]/g)).toHaveLength(4);
    expect(billOverviewPage.match(/table-header text-\[var\(--color-text-muted\)\]/g)).toHaveLength(4);
    expect(billOverviewPage).not.toContain("Not yet fully paid");
  });

  it("uses the shared fixed row height for every financial and expense grid row", () => {
    for (const page of [billOverviewPage, expensesPage, expenseSummaryPage]) {
      expect(page).toContain("table-data-row border-b");
    }
    expect(billOverviewPage).toContain("table-data-row border-t");
    expect(expenseSummaryPage).toContain("table-data-row bg-");
    expect(globalStyles).toContain(".table-data-row");
    expect(globalStyles).toContain("height: var(--table-row-height)");
  });

  it("uses Income rather than Salary throughout the Expense Summary", () => {
    expect(expenseSummaryPage).toContain('"Income", "% of income used"');
    expect(expenseSummaryPage).not.toContain("Salary");
    expect(expenseSummaryPage).not.toContain("salary");
  });

  it("shows Income as a yearly grid with matching period controls and totals", () => {
    expect(expenseIncomePage).toContain('ariaLabel="Select income year"');
    expect(expenseIncomePage).toContain('aria-label="Year type"');
    expect(expenseIncomePage).toContain('"Financial year"');
    expect(expenseIncomePage).toContain('"Calendar year"');
    expect(expenseIncomePage).toContain('aria-label="Previous year"');
    expect(expenseIncomePage).toContain('aria-label="Next year"');
    expect(expenseIncomePage).toContain("function periodMonths");
    expect(expenseIncomePage).toContain(">Month</th><th");
    expect(expenseIncomePage).toContain('month: "long", timeZone: "UTC"');
    expect(expenseIncomePage).not.toContain('month: "long", year: "numeric"');
    expect(expenseIncomePage).not.toContain("min-w-max w-full");
    expect(expenseIncomePage).toContain('className="card-surface table-compact mt-6"');
    expect(globalStyles).toContain(".table-compact");
    expect(globalStyles).toContain("max-width: calc(var(--space-section) * 9)");
    expect(globalStyles).toContain("margin-inline: auto");
    expect(expenseIncomePage).toContain('className="px-4 py-0 text-left font-semibold"');
    expect(expenseIncomePage).toContain('className="px-2 py-0 text-right"');
    expect(expenseIncomePage).toContain('className="px-4 py-0 text-left">Total income</th>');
    expect(expenseIncomePage).toContain("const total = months.reduce");
    expect(expenseIncomePage).toContain(">Total income</th>");
  });

  it("offers persistent drag and button-based section reordering", () => {
    expect(categoryPage).toContain("Reorder Sub category");
    expect(categoryPage).toContain("draggable={reorderingSections}");
    expect(categoryPage).toContain("Reorder ${section.name}; use Arrow Up or Arrow Down to move");
    expect(categoryPage).toContain('event.key === "ArrowUp"');
    expect(categoryPage).toContain('event.key === "ArrowDown"');
    expect(categoryPage).toContain('body: JSON.stringify({ sort_order: index })');
    expect(categoryPage).toContain('reorderingSections ? "w-11 opacity-100"');
    expect(categoryPage).toContain("duration-[var(--duration-reorder)]");
    expect(categoryPage).toContain("previewSectionOrder(section.id)");
    expect(categoryPage).toContain('draggedOverSectionId === section.id ? "translate-y-1"');
  });

  it("uses the shared reorder motion as the transition standard across the application", () => {
    expect(globalStyles).toContain("--duration-standard: 420ms");
    expect(globalStyles).toContain("--duration-reorder: var(--duration-standard)");
    expect(globalStyles).toContain("ease-out");
  });

  it("uses month-only Expense Entry headers because the selected year is already visible", () => {
    expect(expensesPage).toContain('{ month: "short", timeZone: "UTC" }');
    expect(expensesPage).not.toContain('{ month: "short", year: "numeric", timeZone: "UTC" }');
  });

  it("seeds starter sections only for an account without any Expense sections", () => {
    expect(expensesRoute).toContain('select("id", { count: "exact", head: true })');
    expect(expensesRoute).toContain('(count ?? 0) > 0');
    expect(expensesRoute).toContain('.insert(rows)');
    expect(expensesRoute).not.toContain(".upsert(rows");
  });
});
