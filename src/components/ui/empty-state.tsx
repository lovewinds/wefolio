interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-hairline bg-surface shadow-[var(--shadow-1)]">
      <div className="text-center">
        <p className="text-lg font-medium text-ink-subtle">{title}</p>
        {description && <p className="mt-2 text-sm text-ink-faint">{description}</p>}
      </div>
    </div>
  );
}
