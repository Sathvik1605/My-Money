ALTER TABLE public.expense_sections
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.expense_line_items
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

WITH ordered_sections AS (
  SELECT id, row_number() OVER (PARTITION BY user_id, category ORDER BY created_at, id) - 1 AS position
  FROM public.expense_sections
)
UPDATE public.expense_sections
SET sort_order = ordered_sections.position
FROM ordered_sections
WHERE expense_sections.id = ordered_sections.id;

WITH ordered_items AS (
  SELECT id, row_number() OVER (PARTITION BY section_id ORDER BY created_at, id) - 1 AS position
  FROM public.expense_line_items
)
UPDATE public.expense_line_items
SET sort_order = ordered_items.position
FROM ordered_items
WHERE expense_line_items.id = ordered_items.id;

CREATE INDEX expense_sections_user_category_sort_order_idx
  ON public.expense_sections (user_id, category, sort_order);

CREATE INDEX expense_line_items_section_sort_order_idx
  ON public.expense_line_items (section_id, sort_order);
