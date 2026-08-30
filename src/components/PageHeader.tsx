interface PageHeaderProps {
  title: string;
  titleClassName?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, titleClassName, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-hairline)] pb-5">
      <div>
        <h1 className={`text-2xl font-semibold text-balance ${titleClassName ?? ""}`}>{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
